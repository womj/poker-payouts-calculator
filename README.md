# 💰 Poker Cash Game Payouts Calculator

A mobile-friendly web app for calculating poker cash game payouts with automatic data persistence.

## Features

- ✨ **Easy to Use**: Add players, enter buy-ins and cash-outs, and calculate settlements
- 💾 **Auto-Save**: All data is automatically saved in browser localStorage (no refresh data loss)
- 📱 **Mobile Friendly**: Responsive design that works great on phones and tablets
- ✏️ **Easy Editing**: Edit player data anytime - changes are saved automatically
- ⚖️ **Smart Dampening**: If total wins exceed total losses, winners' gains are proportionally reduced
- 📊 **Clear Results**: Visual display shows who owes/receives money
- 📤 **Export**: Download your game data as JSON

## Live Demo

Once deployed, your app will be available at: `https://[your-username].github.io/poker-payouts-calculator`

## Local Development

1. Clone the repository:

```bash
git clone https://github.com/[your-username]/poker-payouts-calculator.git
cd poker-payouts-calculator
```

2. Open `index.html` in your browser or use a local server:

```bash
python -m http.server 8000
# or
npx serve
```

3. Visit `http://localhost:8000` in your browser

## Deployment to GitHub Pages

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages.

### Setup Instructions:

1. Push this code to your GitHub repository
2. Go to your repository settings
3. Navigate to **Pages** (under "Code and automation")
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. Push to the `main` branch or manually trigger the workflow
6. Your site will be live at `https://[your-username].github.io/poker-payouts-calculator`

The deployment happens automatically on every push to the `main` branch.

## How It Works

### Calculation Logic

1. **Net Change**: For each player: `Cash Out - Buy In = Net Change`
2. **Winners & Losers**: Players with positive net change are winners, negative are losers
3. **Dampening**: If total wins > total losses:
   - Calculate dampening factor: `total losses / total wins`
   - Each winner's gain is multiplied by this factor
   - This ensures payouts match available funds

### Example:

Without dampening:

- Player A: Won $100
- Player B: Won $50
- Player C: Lost $100
- Total wins ($150) > Total losses ($100)

With proportional dampening:

- Dampening factor: 100/150 = 0.6667
- Player A gets: $100 × 0.6667 = $66.67
- Player B gets: $50 × 0.6667 = $33.33
- Player C pays: $100
- ✅ Balanced: $100 in, $100 out

## Data Persistence

- All player data is stored in browser localStorage
- Data persists across page refreshes
- Each browser/device has its own data
- Use the "Export Data" button to backup or share game data
- Use "Clear All Data" to start fresh

## Technologies Used

- Pure HTML, CSS, and JavaScript (no frameworks required)
- LocalStorage API for data persistence
- GitHub Actions for CI/CD
- GitHub Pages for free hosting

## Browser Compatibility

Works on all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use and modify as needed.

## Contributing

Issues and pull requests are welcome!
