# Frag Arena

Frag Arena is a high-octane, synthwave-themed 2D platform fighter built specifically for the Reddit platform using the Devvit framework and Phaser 3.

## Features

- **Retro Synthwave Aesthetic**: A beautiful neon art style with custom procedural graphics and particle effects.
- **Fast-Paced Combat**: Smooth, responsive 2D platforming physics paired with dynamic shooting mechanics.
- **Procedural IK Animation**: Stickman characters are brought to life through real-time inverse kinematics and procedural animations.
- **Bot vs Bot**: Drop into the background of the main menu and watch high-level AI bots duel it out.
- **Touch-Friendly HUD**: A specialized mobile layout built explicitly for seamless play on smartphones within the Reddit feed.

## Tech Stack

- **Frontend**: Phaser 3, React (Vite)
- **Backend Environment**: Node.js (Reddit Devvit Serverless)
- **Communication**: tRPC

## Project Structure

- `/src/client`: Frontend React & Phaser code (executed in a secure iframe on reddit.com).
- `/src/server`: Backend serverless logic running on Devvit.

## Scripts

- `npm run dev`: Boot up the Reddit Devvit playtest environment.
- `npm run dev:client`: Start the local Vite server to test frontend changes outside of Reddit.
- `npm run type-check`: Validate TypeScript types.
- `npm run lint`: Run the linter.

## Deployment

To push your changes directly to the Reddit platform, use the Devvit CLI:

```bash
npx devvit upload
```

This commands packages the game and pushes the latest bundle to your active Reddit app namespace.
