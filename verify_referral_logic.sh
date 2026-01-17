#!/bin/bash

# 1. Login
echo "Logging in..."
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vanessakrystal231@gmail.com","password":"Passphrase123!"}' > /dev/null

echo "Login successful."

# 2. Create a new patient logic (mocking by using email of someone who might not exist or reusing one)
# We need a dynamic patient or a known one. Let's use a random email to trigger creation loop or existing one.
# Let's use "testpatient_$(date +%s)@example.com"
PATIENT_EMAIL="testpatient_$(date +%s)@example.com"
PATIENT_NAME="Test Patient $(date +%s)"

echo "Creating 1st Referral for $PATIENT_EMAIL..."
RESPONSE=$(curl -s -b cookies.txt -X POST http://localhost:3000/api/referrals \
  -H "Content-Type: application/json" \
  -d "{\"patientEmail\":\"$PATIENT_EMAIL\", \"patientName\":\"$PATIENT_NAME\", \"facility_from\":\"Home\", \"facility_to\":\"Test Facility\", \"reason\":\"Checkup\", \"urgency\":\"routine\"}")

echo "Response 1: $RESPONSE"

if [[ $RESPONSE == *"Referral created"* ]]; then
    echo "First referral created successfully."
else
    echo "Failed to create first referral."
    exit 1
fi

echo "Creating 2nd Referral for $PATIENT_EMAIL (Should Fail)..."
RESPONSE_2=$(curl -s -b cookies.txt -X POST http://localhost:3000/api/referrals \
  -H "Content-Type: application/json" \
  -d "{\"patientEmail\":\"$PATIENT_EMAIL\", \"patientName\":\"$PATIENT_NAME\", \"facility_from\":\"Home\", \"facility_to\":\"Test Facility\", \"reason\":\"Checkup\", \"urgency\":\"routine\"}")

echo "Response 2: $RESPONSE_2"

if [[ $RESPONSE_2 == *"Patient already has an active referral"* ]]; then
    echo "SUCCESS: Duplicate referral correctly rejected."
else
    echo "FAILURE: Duplicate referral was NOT rejected."
    exit 1
fi
