#!/bin/bash

# Read lines from .env.development
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ $key =~ ^#.*$ ]] && continue
  [[ -z $key ]] && continue
  
  # Remove any potential surrounding quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  echo "Adding $key..."
  # echo -n "$value" | vercel env add "$key" production
  # Using printf to safely pass the value without newline to stdin
  printf "%s" "$value" | vercel env add "$key" production
  
done < .env.development

echo "All variables added. Triggering redeployment..."
vercel --prod
