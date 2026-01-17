#!/bin/bash
# 1. Login
echo "Logging in..."
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vanessakrystal231@gmail.com","password":"Passphrase123!"}'

echo -e "\n\n2. Assigning Facility..."
# Use Miriam's ID and Kenyatta Hospital ID
curl -b cookies.txt -v -X PUT http://localhost:3000/api/admin/users/4be97c94-2251-4de2-a9b1-8b94aa8bde2c/facility \
  -H "Content-Type: application/json" \
  -d '{"facilityId":"8ed07b7a-af65-4be8-87bd-29bde1be5fbe", "role":"doctor"}'
