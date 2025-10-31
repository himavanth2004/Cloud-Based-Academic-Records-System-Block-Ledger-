# Block Ledger — Blockchain-based Academic Records System

Block Ledger is a starter full-stack project that demonstrates how academic records
(degrees, transcripts, certificates) can be stored in a tamper-evident blockchain-style
ledger and served through a REST API. It is designed as a learning/demo project — not
a production blockchain.

Features
- User registration and authentication (JWT)
- Submit academic records (student name, institution, degree, grade, date)
- Records are appended to a simple blockchain implemented in the backend (SHA-256 hashed blocks)
- Verify integrity of the ledger by validating hashes and chain linking
- Frontend to create and view records, and verify chain integrity
- Dockerfile and docker-compose for local development

Quickstart (local)
1. Copy `.env.example` -> `.env` and adjust values.
2. Start backend and frontend:
   ```bash
   docker-compose up --build
   ```
3. Backend: http://localhost:5000
   Frontend: http://localhost:3000

Security notes
- This project uses a simple blockchain-like structure for demonstration only.
- For production, consider real permissioned blockchains (Hyperledger Fabric) or public chains with proper key management.
