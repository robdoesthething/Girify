#!/usr/bin/env python3
"""Regenerate Girify image assets in one uniform pixel-art style.

Usage:
  python3 scripts/regenAssets.py [--backend gemini|fal] [--only path1,path2] [--dry-run]

Reads prompts from scripts/asset-manifest.json.
Keys: GEMINI_API_KEY (free at aistudio.google.com) or FAL_KEY, in env or .env.development.
Post-processes: chroma-key background -> transparent, trim, pad, resize 256px.
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "asset-manifest.json"
GEMINI_MODEL = "gemini-2.5-flash-image"
FAL_MODEL = "fal-ai/nano-banana-2"
OUT_SIZE = 256
PAD_RATIO = 0.06  # transparent margin around trimmed subject
KEY_TOLERANCE = 70  # RGB distance for background keying


def load_key(name: str) -> Optional[str]:
    key = os.environ.get(name)
    if key:
        return key
    env_file = ROOT / ".env.development"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip()
    return None


def http_json(method: str, url: str, headers: dict, payload: Optional[dict] = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:500]
        raise RuntimeError(f"HTTP {e.code}: {body}")


def generate_gemini(prompt: str, key: str) -> bytes:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt + " Square 1:1 image."}]}],
        "generationConfig": {"imageConfig": {"aspectRatio": "1:1"}},
    }
    last_err = None
    for attempt in range(4):
        try:
            res = http_json("POST", url, {"x-goog-api-key": key}, payload)
            for part in res["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    return base64.b64decode(part["inlineData"]["data"])
            raise RuntimeError(f"no image in response: {json.dumps(res)[:300]}")
        except RuntimeError as e:
            last_err = e
            msg = str(e)
            if "429" in msg or "503" in msg:
                wait = 20 * (attempt + 1)
                print(f"  rate limited, retrying in {wait}s")
                time.sleep(wait)
                continue
            raise
    sys.exit(f"gemini failed after retries: {last_err}")


def generate_pollinations(prompt: str, _key: Optional[str] = None) -> bytes:
    from urllib.parse import quote

    url = (
        f"https://image.pollinations.ai/prompt/{quote(prompt)}"
        "?width=1024&height=1024&nologo=true&model=flux"
    )
    last_err = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "girify-asset-pipeline"})
            with urllib.request.urlopen(req, timeout=300) as res:
                data = res.read()
            if len(data) < 10000:
                raise RuntimeError(f"suspiciously small image ({len(data)} bytes)")
            return data
        except Exception as e:
            last_err = e
            wait = 15 * (attempt + 1)
            print(f"  pollinations error ({e}), retrying in {wait}s")
            time.sleep(wait)
    sys.exit(f"pollinations failed after retries: {last_err}")


def fal_request(method: str, url: str, key: str, payload: Optional[dict] = None) -> dict:
    try:
        return http_json(method, url, {"Authorization": f"Key {key}"}, payload)
    except RuntimeError as e:
        sys.exit(f"fal.ai {e}")


def generate_fal(prompt: str, key: str) -> bytes:
    submit = fal_request(
        "POST",
        f"https://queue.fal.run/{FAL_MODEL}",
        key,
        {"prompt": prompt, "image_size": "square", "num_images": 1},
    )
    req_id = submit["request_id"]
    status_url = f"https://queue.fal.run/{FAL_MODEL}/requests/{req_id}/status"
    result_url = f"https://queue.fal.run/{FAL_MODEL}/requests/{req_id}"
    for _ in range(120):
        time.sleep(2)
        status = fal_request("GET", status_url, key)
        state = status.get("status")
        if state == "COMPLETED":
            result = fal_request("GET", result_url, key)
            url = result["images"][0]["url"]
            with urllib.request.urlopen(url, timeout=120) as res:
                return res.read()
        if state in ("FAILED", "CANCELLED"):
            sys.exit(f"generation failed: {status}")
    sys.exit("generation timed out")


def build_prompt(manifest: dict, entry: dict) -> str:
    framing = manifest[f"_framing_{entry['framing']}"]
    return f"{manifest['_style']}, {framing}: {entry['subject']}"


def key_background(img: Image.Image) -> Image.Image:
    """Make the background transparent by sampling corner colors and keying near matches."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    tol = KEY_TOLERANCE
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if (
                abs(r - bg[0]) <= tol
                and abs(g - bg[1]) <= tol
                and abs(b - bg[2]) <= tol
            ):
                px[x, y] = (r, g, b, 0)
    return img


def process(raw: bytes, out_path: Path) -> None:
    tmp = out_path.with_suffix(".raw.png")
    tmp.write_bytes(raw)
    img = Image.open(tmp)
    img = key_background(img)
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    side = max(img.size)
    pad = int(side * PAD_RATIO)
    canvas = Image.new("RGBA", (side + 2 * pad, side + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad), img)
    canvas = canvas.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    canvas.save(out_path, "PNG", optimize=True)
    tmp.unlink()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", choices=["gemini", "fal", "pollinations"], default=None)
    ap.add_argument("--only", help="comma-separated manifest paths to generate")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    manifest = json.loads(MANIFEST.read_text())
    entries = manifest["assets"]
    if args.only:
        wanted = set(args.only.split(","))
        entries = [e for e in entries if e["path"] in wanted]

    if args.dry_run:
        for e in entries:
            print(f"{e['path']}\n  {build_prompt(manifest, e)}\n")
        return

    backend = args.backend
    if backend is None:
        backend = "gemini" if load_key("GEMINI_API_KEY") else "fal"
    key = None if backend == "pollinations" else load_key(
        "GEMINI_API_KEY" if backend == "gemini" else "FAL_KEY"
    )
    if backend != "pollinations" and not key:
        sys.exit(f"missing API key for backend '{backend}'")
    generate = {
        "gemini": generate_gemini,
        "fal": generate_fal,
        "pollinations": generate_pollinations,
    }[backend]

    print(f"backend={backend} assets={len(entries)}")
    for i, e in enumerate(entries, 1):
        out = ROOT / e["path"]
        prompt = build_prompt(manifest, e)
        print(f"[{i}/{len(entries)}] {e['path']}")
        raw = generate(prompt, key)
        process(raw, out)
        print(f"  ok -> {out} ({out.stat().st_size // 1024} KB)")
        if backend != "fal" and i < len(entries):
            time.sleep(4)  # stay under free-tier RPM
    print("done")


if __name__ == "__main__":
    main()
