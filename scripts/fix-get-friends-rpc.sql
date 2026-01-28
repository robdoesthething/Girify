-- Fix get_friends RPC to normalize username input
-- This ensures it works whether username has @ prefix or not

CREATE OR REPLACE FUNCTION get_friends(user_username TEXT)
RETURNS TABLE(friend_username TEXT, since TIMESTAMPTZ) AS $$
DECLARE
    normalized_username TEXT;
BEGIN
    -- Normalize the input username to lowercase and ensure @ prefix
    normalized_username := LOWER(user_username);
    IF NOT normalized_username LIKE '@%' THEN
        normalized_username := '@' || normalized_username;
    END IF;

    RETURN QUERY
    SELECT
        CASE
            WHEN f.user_a = normalized_username THEN f.user_b
            ELSE f.user_a
        END as friend_username,
        f.created_at as since
    FROM friendships f
    WHERE f.user_a = normalized_username OR f.user_b = normalized_username;
END;
$$ LANGUAGE plpgsql;

-- Also fix are_friends to normalize inputs
CREATE OR REPLACE FUNCTION are_friends(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
    norm_user1 TEXT;
    norm_user2 TEXT;
BEGIN
    -- Normalize both usernames
    norm_user1 := LOWER(user1);
    norm_user2 := LOWER(user2);

    IF NOT norm_user1 LIKE '@%' THEN
        norm_user1 := '@' || norm_user1;
    END IF;

    IF NOT norm_user2 LIKE '@%' THEN
        norm_user2 := '@' || norm_user2;
    END IF;

    -- Order them alphabetically for consistent lookups
    IF norm_user1 < norm_user2 THEN
        a := norm_user1;
        b := norm_user2;
    ELSE
        a := norm_user2;
        b := norm_user1;
    END IF;

    RETURN EXISTS(
        SELECT 1 FROM friendships
        WHERE user_a = a AND user_b = b
    );
END;
$$ LANGUAGE plpgsql;

-- Fix add_friendship to normalize inputs
CREATE OR REPLACE FUNCTION add_friendship(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
    norm_user1 TEXT;
    norm_user2 TEXT;
BEGIN
    -- Normalize both usernames
    norm_user1 := LOWER(user1);
    norm_user2 := LOWER(user2);

    IF NOT norm_user1 LIKE '@%' THEN
        norm_user1 := '@' || norm_user1;
    END IF;

    IF NOT norm_user2 LIKE '@%' THEN
        norm_user2 := '@' || norm_user2;
    END IF;

    -- Order them alphabetically
    IF norm_user1 < norm_user2 THEN
        a := norm_user1;
        b := norm_user2;
    ELSE
        a := norm_user2;
        b := norm_user1;
    END IF;

    INSERT INTO friendships (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;

    -- Update friend counts
    UPDATE users SET friend_count = friend_count + 1 WHERE username IN (norm_user1, norm_user2);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fix remove_friendship to normalize inputs
CREATE OR REPLACE FUNCTION remove_friendship(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
    norm_user1 TEXT;
    norm_user2 TEXT;
BEGIN
    -- Normalize both usernames
    norm_user1 := LOWER(user1);
    norm_user2 := LOWER(user2);

    IF NOT norm_user1 LIKE '@%' THEN
        norm_user1 := '@' || norm_user1;
    END IF;

    IF NOT norm_user2 LIKE '@%' THEN
        norm_user2 := '@' || norm_user2;
    END IF;

    -- Order them alphabetically
    IF norm_user1 < norm_user2 THEN
        a := norm_user1;
        b := norm_user2;
    ELSE
        a := norm_user2;
        b := norm_user1;
    END IF;

    DELETE FROM friendships WHERE user_a = a AND user_b = b;

    -- Update friend counts
    UPDATE users SET friend_count = friend_count - 1 WHERE username IN (norm_user1, norm_user2);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
