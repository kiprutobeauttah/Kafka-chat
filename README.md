# Kafka Chat  

  _Easier way to test Kafka_

## Description
This is a Kafka-based chat application built with Node.js. It leverages WebSocket for real-time communication, Kafka for message broadcasting, and PostgreSQL with Prisma for persistent storage. The application also includes user authentication using bcrypt and JWT.

### Features
- Real-time messaging with WebSocket.
- Kafka integration for scalable message broadcasting.
- PostgreSQL database with Prisma ORM for storing messages and user data.

## Workflow
The following Mermaid diagram illustrates the workflow of the Kafka Chat Application:

```mermaid
graph TD
    A[Client] -->|WebSocket| B[WebSocket Server]
    B -->|Save Message| C[PostgreSQL Database]
    B -->|Send to Kafka| D[Kafka Producer]
    D --> E[Kafka Broker]
    E --> F[Kafka Consumer]
    F -->|Broadcast to Clients| B
```

## Tools Needed
To run this application, you need the following tools:
- **Kafka**: A distributed event streaming platform. Install and configure Kafka on your system.
- **Node.js**: JavaScript runtime for running the application.
- **PostgreSQL**: Database for storing messages and user data.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kiprutobeauttah/Kafka-chat.git
   ```
2. Navigate to the project directory:
   ```bash
   cd kafka-chat
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/kafka_chat"
   ```
5. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```
6. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
7. Start the application:
   ```bash
   npm run dev
   ```

## Database Management
- **View database**: `npm run prisma:studio`
- **Create migration**: `npm run prisma:migrate`
- **Generate client**: `npm run prisma:generate`

## Auto-Run Scripts
To simplify starting the Kafka Chat Application, use the provided scripts in the `kafka` folder:

### Windows
Run the `.bat` file:
```cmd
cd kafka
run-kafka-chat.bat
```

### Linux/Mac
Run the `.sh` file:
```bash
cd kafka
./run-kafka-chat.sh
```
Ensure the `.sh` file has executable permissions:
```bash
chmod +x kafka/run-kafka-chat.sh
```

## Download Kafka
To download and extract Kafka, use the provided scripts in the `kafka` folder:

#### Windows
Run the `.bat` file:
```cmd
cd kafka
download-kafka.bat
```

#### Linux/Mac
Run the `.sh` file:
```bash
cd kafka
./download-kafka.sh
```
Ensure the `.sh` file has executable permissions:
```bash
chmod +x kafka/download-kafka.sh
```

## Screenshots
### Chat Interface
![Chat Interface](scrt/new-login.png)
![Chat Interface](scrt/new-chat.png)

### Kafka Workflow
![Kafka Workflow](scrt/kafka-workflow.png)

---
Ensure Kafka and PostgreSQL are running locally before starting the application. Refer to the Kafka and PostgreSQL documentation for setup instructions.