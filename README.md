
# Voting System Backend

This is a Node.js backend application built with Express, utilizing PostgreSQL for the database, JWT for authentication, and other dependencies for a secure API setup.


## Prerequisites

Node.js (latest stable version)

npm (comes with Node.js)

PostgreSQL 
## Installation


Clone the repo:

```bash
git clone https://github.com/arbinthaku5/votekaro.git
cd votekaro
```
    

Install dependencies:

```bash
npm install
```


Set up environment variables:

```bash
PORT=4000
DATABASE_URL=postgresql://username:your_password@localhost:5432/database
JWT_ACCESS_SECRET=replace_this_with_a_long_random_string
ACCESS_TOKEN_EXPIRES_IN=time_in_minutes
BCRYPT_SALT=12
```

Set up the database:

```bash
createdb votekaro
```

    
## Running the project

For development with auto-restart:

```bash
npm run dev
```