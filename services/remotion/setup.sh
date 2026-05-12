#!/bin/bash

echo "================================================"
echo "School Counselor Recruitment Video - Setup"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm detected: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Dependencies installed successfully!"
else
    echo ""
    echo "❌ Failed to install dependencies."
    exit 1
fi

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Generate voiceover (see VOICEOVER_GUIDE.md)"
echo "   - Use ElevenLabs with Matilda voice"
echo "   - Save as assets/voiceover.mp3"
echo ""
echo "2. Start Remotion Studio:"
echo "   npm start"
echo ""
echo "3. Preview your video in the browser"
echo ""
echo "4. Make any adjustments needed"
echo ""
echo "5. Render final video:"
echo "   npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4"
echo ""
echo "================================================"
echo ""
echo "For more information, see README.md"
echo ""
