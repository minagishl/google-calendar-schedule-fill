# Google Calendar Schedule Fill

A Chrome extension that automatically fills your availability on scheduling sites from Google Calendar.

Supported sites:

- [Tonton](https://tonton.amaneku.com/)
- [Tappy](http://tap-py.com/)

## Features

- Automatically extracts schedule information from Google Calendar
- Converts calendar events to a structured format
- Uses ical.js for reliable calendar data parsing
- Built as a Chrome extension for seamless integration

## Technology Stack

- React 19
- TypeScript
- Vite

## Chrome Web Store

You can install this extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/lfgjlkfemoaaindkcgdncghkomgmmemi).

## Manual Installation

1. Run `bun run build` to create the production build
2. Open `chrome://extensions` in Chrome browser
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder

## Usage

1. Configure your Google Calendar ICS URL in the extension settings
2. Open a supported scheduling site (Tonton or Tappy)
3. Click "Apply Calendar" to fill your availability based on your calendar

## Technical Details

- Built with React and TypeScript for robust type safety
- Vite for fast development and optimized builds
- Chrome Extension Manifest V3 compliant
- Uses ical.js for reliable calendar data parsing
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for linting and formatting

## Browser Compatibility

While this extension is primarily tested on Chrome, it uses [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) which should make it compatible with other modern browsers that support Web Extensions (though this hasn't been extensively tested).

## Development

### Prerequisites

- Node.js 20 or higher
- Bun package manager

### Development Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/minagishl/google-calendar-schedule-fill
   cd google-calendar-schedule-fill
   bun install
   ```

2. Start development mode:

   ```bash
   bun run dev
   ```

3. Build for production:
   ```bash
   bun run build
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
