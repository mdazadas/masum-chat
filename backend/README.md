# Masum Chat Backend

This folder contains the backend logic and database scripts for Masum Chat.

## Structure

- `server.js`: A specialized Node.js/Express server (optional, can be used for custom APIs not handled by Supabase).
- `database/`: Contains all SQL scripts to setup and manage the Supabase PostgreSQL database.

## Usage

### Using SQL Scripts
The SQL files in the `database` folder are used to configure your Supabase project. You can run these in the Supabase SQL Editor.

### Running the Local Server (Optional)
If you want to run a custom backend server locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`.
