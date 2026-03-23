# PostgreSQL Quickstart for Relay

This guide covers how to start the database, push the schema, inspect your data, and run common queries. No prior PostgreSQL experience required.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- The Relay project cloned and `npm install` completed

## 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container in the background. The database is called `relay_tasks` and the credentials are `postgres`/`postgres` (local dev only).

To check it's running:

```bash
docker compose ps
```

You should see the `db` service with status `running`.

To stop it later:

```bash
docker compose down
```

Your data is stored in a Docker volume (`pgdata`) and survives restarts. To delete all data and start fresh:

```bash
docker compose down -v
```

## 2. Create the tables

Copy the env file if you haven't already:

```bash
cp .env.example .env
```

Then push the Drizzle schema to the database:

```bash
npm run db:push
```

This creates all the tables (tasks, projects, initiatives, agent_threads, agent_thread_messages, agent_calls).

## 3. Connect to the database

### Option A: psql (command line)

```bash
docker compose exec db psql -U postgres -d relay_tasks
```

This drops you into an interactive SQL prompt. Type `\q` to exit.

### Option B: Drizzle Studio (browser GUI)

```bash
npm run db:studio
```

Opens a web UI at `https://local.drizzle.studio` where you can browse tables, run queries, and edit rows visually. This is the easiest way to explore your data.

### Option C: Any database GUI

Use any PostgreSQL client (TablePlus, pgAdmin, DBeaver, Postico) with these connection settings:

| Setting  | Value              |
|----------|--------------------|
| Host     | `localhost`        |
| Port     | `5432`             |
| Database | `relay_tasks`      |
| User     | `postgres`         |
| Password | `postgres`         |

## 4. Useful psql commands

Once connected via `psql`, these commands help you navigate:

```
\dt              List all tables
\d tasks         Describe the tasks table (columns, types)
\d projects      Describe the projects table
\d agent_threads Describe the agent_threads table
\x               Toggle expanded display (one column per line)
\q               Quit
```

## 5. Common queries

### See all tasks

```sql
SELECT id, title, completed, project_id, created_at
FROM tasks
ORDER BY created_at;
```

### See tasks with their project names

```sql
SELECT t.id, t.title, t.completed, p.name AS project
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY t.created_at;
```

### See all projects

```sql
SELECT id, name, initiative_id, deadline
FROM projects
ORDER BY created_at;
```

### See all initiatives

```sql
SELECT id, name, description, deadline
FROM initiatives
ORDER BY created_at;
```

### See thread messages for a specific task

```sql
SELECT m.id, m.role, m.content, m.provider_id, m.status, m.created_at
FROM agent_thread_messages m
JOIN agent_threads t ON m.thread_id = t.id
WHERE t.owner_id = 'task-1'
ORDER BY m.created_at;
```

### Count tasks by project

```sql
SELECT p.name, COUNT(t.id) AS task_count
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.name
ORDER BY task_count DESC;
```

### Find overdue tasks (due_by in the past)

```sql
SELECT id, title, due_by
FROM tasks
WHERE due_by != '' AND due_by < CURRENT_DATE::text AND completed = false
ORDER BY due_by;
```

### Find completed tasks

```sql
SELECT id, title, completed_at
FROM tasks
WHERE completed = true
ORDER BY completed_at DESC;
```

## 6. Editing data directly

### Update a task title

```sql
UPDATE tasks
SET title = 'New title here', updated_at = NOW()
WHERE id = 'task-1';
```

### Delete a task

```sql
DELETE FROM tasks WHERE id = 'task-1';
```

Note: deleting a task also deletes its thread messages (cascade).

### Insert a project manually

```sql
INSERT INTO projects (id, name, deadline)
VALUES ('project-manual', 'My Manual Project', '');
```

## 7. Backup and restore

### Export the whole database

```bash
docker compose exec db pg_dump -U postgres relay_tasks > backup.sql
```

### Restore from a backup

```bash
docker compose exec -T db psql -U postgres relay_tasks < backup.sql
```

### Export a single table to CSV

```bash
docker compose exec db psql -U postgres -d relay_tasks \
  -c "COPY tasks TO STDOUT WITH CSV HEADER" > tasks.csv
```

## 8. Troubleshooting

**"connection refused" when running `npm run db:push`**
- Make sure Docker Desktop is running
- Run `docker compose up -d` and wait a few seconds for PostgreSQL to start
- Check with `docker compose logs db`

**Tables already exist errors**
- This is fine — `db:push` is idempotent and updates the schema in place

**Want to start completely fresh**
- `docker compose down -v` removes all data
- Then `docker compose up -d` and `npm run db:push` again

**App loads but doesn't persist to database**
- Check that `.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/relay_tasks`
- Restart the dev server after creating `.env` (`npm run dev`)
