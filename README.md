# solana-feeless-relayer

## Getting Started

### Prerequisites

- Node v18.18.0 or higher

- Rust v1.77.2 or higher
- Anchor CLI 0.30.1 or higher
- Solana CLI 1.18.17 or higher

### Installation

#### Clone the repo

```shell
git clone <repo-url>
cd <repo-name>
```

#### Install Dependencies

```shell
pnpm install
```

#### Start the web app

```
pnpm dev
```

## Apps

### anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the command with `pnpm`, eg: `pnpm anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program.

You will manually need to update the constant in `anchor/lib/basic-exports.ts` to match the new program id.

```shell
pnpm anchor keys sync
```

#### Build the program:

```shell
pnpm anchor-build
```

#### Start the test validator with the program deployed:

```shell
pnpm anchor-localnet
```

#### Run the tests

```shell
pnpm anchor-test
```

#### Deploy to Devnet

```shell
pnpm anchor deploy --provider.cluster devnet
```

### web

This is a React app that uses the Anchor generated client to interact with the Solana program.

#### Commands

Start the web app

```shell
pnpm dev
```

Build the web app

```shell
pnpm build
```

### Setting up a Local PostgreSQL Database

To set up a local PostgreSQL database for use with this app, follow these steps:

1. **Install PostgreSQL**:
   We recommend using Homebrew to install PostgreSQL. If you don't have Homebrew installed, you can install it from [here](https://brew.sh/).

   Open your terminal and run the following command to install PostgreSQL:
   ```shell
   brew install postgresql
   ```

2. **Start PostgreSQL Service**:
   After installation, start the PostgreSQL service with the following command:
   ```shell
   brew services start postgresql
   ```

3. **Create a New Database**:
   Create a new PostgreSQL database by running:
   ```shell
   createdb mydatabase
   ```
   Replace `mydatabase` with your desired database name.

4. **Add Database URL to Environment Variables**:
   You need to add your database connection URL to the `.env.local` file. Open the `.env.local` file and add the following line:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/mydatabase?schema=public"
   ```
   Replace `<username>` with your PostgreSQL username, `<password>` with your PostgreSQL password, and `mydatabase` with the name of your database. Note that the password is empty by default.

5. **Working with the Prisma Schema**:
   Open the `prisma/schema.prisma` file and configure your data model. Here is an example schema that matches the context provided:

   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model Transaction {
     id            String              @id @default(cuid())
     referenceId   String
     requestedByIp String
     amount        String
     mint          String
     mintSymbol    String
     destination   String
     sender        String
     feeInLamports String
     feeInSpl      String
     rawTx         String
     statuses      TransactionStatus[]
     createdAt     DateTime            @default(now())
   }

   model TransactionStatus {
     id            Int         @id @default(autoincrement())
     transaction   Transaction @relation(fields: [transactionId], references: [id])
     transactionId String
     status        String
     createdAt     DateTime    @default(now())
   }
   ```

6. **Sync the Prisma Schema to the Database**:
   After configuring your schema, create a migration to set up your database tables:
   ```shell
   pnpm prisma-deploy
   ```

   This command will sync the Prisma schema to the database.

7. **Generate Prisma Client**:
   Finally, generate the Prisma Client, which you will use to interact with your database in your code:
   ```shell
   pnpm prisma generate
   ```

   Now you are ready to use Prisma in your project. You can import the Prisma Client and start querying your database.

   For more detailed information, refer to the [Prisma documentation](https://www.prisma.io/docs).
