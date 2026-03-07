#!/bin/bash
# ============================================================
# Script de push vers GitHub - Institut Gabriel Rita
# ============================================================
set -e

GITHUB_URL="https://github.com/BAGOIDI/institut-gabriel-rita-project.git"

echo "🚀 Initialisation du dépôt Git..."
git init

git remote remove origin 2>/dev/null || true
git remote add origin $GITHUB_URL

echo "📋 Ajout des fichiers..."
git add .

echo "💾 Commit..."
git commit -m "fix: CRUD frontend-backend aligné service par service

FINANCE SERVICE:
- Réécriture Payment entity (champs type, amount, penalty, discount, method, studentId, teacherId, paymentDate)
- Réécriture CreatePaymentDto pour matcher le payload du frontend Payments.tsx
- Ajout GET /finance (findAll) appelé par fetchPayments()
- Ajout GET /finance/stats (statistiques globales)
- Suppression dépendance StudentFee (simplifié)

SERVICE-CORE-SCOLARITE:
- GET /students/search retourne { hits, total, page, lastPage } (compatible frontend)
- GET /staff/search retourne { hits, total, page, lastPage } (compatible frontend)

FRONTEND - Students.tsx:
- Ajout boutons Edit (Edit icon) et Delete (Trash2) dans tableau ET vue carte
- StudentForm accepte prop student pour mode édition
- handleSubmit: PATCH /students/:id si édition, POST /students si création
- handleDelete: DELETE /students/:id avec confirmation
- Titre modal dynamique (Modifier / Nouveau)
- fetchStudents: lecture hits compatible NestJS et Typesense"

echo "⬆️  Push vers GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Projet pushé avec succès !"
echo "🔗 https://github.com/BAGOIDI/institut-gabriel-rita-project"
