# Infobip API Filter Query Builder

An interactive web application that helps users construct and test filter queries for Infobip's GET person API endpoint. This tool was built to address a critical support problem where 34.6% of support tickets stem from confusion about API filter syntax, operators, and URL encoding.

## Features

- **Visual Filter Builder**: Construct filter queries without manual syntax
- **Dynamic Attribute Loading**: Fetches real profile attributes from your Infobip account (standard + custom)
- **Real-time Preview**: Shows both raw and URL-encoded filter strings
- **Live API Testing**: Test queries immediately against the Infobip API
- **Operator Documentation**: Inline help explaining what each operator does
- **Example Filters**: Quick-load common filter patterns
- **Responsive Design**: Works on desktop and mobile devices

## Problem Solved

Users of Infobip's GET person API consistently struggle with:
- Custom filter query parameter syntax requiring URL encoding
- Confusing operators (#ne doesn't exist, #not vs #contains misunderstanding)
- The #contains operator searches for exact tag names, not substrings
- Misleading error messages that don't indicate query problems

**Real support example**: Thread 1760607690 - Client spent 47 replies over multiple days trying to filter users by tags, trying various wrong operators before finding the correct one.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- An Infobip account with API access

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser to `http://localhost:5173`

### Usage

1. **Configure API Access**:
   - Enter your Infobip API base URL (default: `https://api.infobip.com`)
   - Enter your API key (get this from your Infobip account settings)
   - Click "Load Attributes" to fetch available profile fields

2. **Build Your Filter**:
   - Select a field from the dropdown (shows your actual account attributes)
   - Choose an operator (#eq, #contains, #in, etc.)
   - Enter the value to filter by
   - Add multiple conditions as needed

3. **Preview and Test**:
   - See the raw and URL-encoded filter strings in real-time
   - Copy the encoded filter for use in your own applications
   - Click "Test Query" to run the filter against your live API

4. **Review Results**:
   - See HTTP status, response time, and full JSON response
   - Clear error messages help debug filter issues

## API Endpoints Used

This application connects to:

1. **GET person endpoint**: `https://api.infobip.com/people/2/persons`
   - Used to fetch profile data and test filter queries
   - [API Documentation](https://www.infobip.com/docs/api/customer-engagement/people/person-profile/get-a-single-person-or-a-list-of-people)

2. **GET custom attributes**: `https://api.infobip.com/people/2/persons/custom-attributes`
   - Used to fetch custom attribute definitions
   - [API Documentation](https://www.infobip.com/docs/api/customer-engagement/people/custom-attributes/get-a-list-of-custom-attributes)

## Filter Operators

- **#eq**: Exact match - field equals the specified value
- **#contains**: Exact match for arrays (e.g., tags) - NOT substring search
- **#in**: Field value is in the provided list (comma-separated)
- **#gt**: Greater than
- **#gte**: Greater than or equal to
- **#lt**: Less than
- **#lte**: Less than or equal to
- **#like**: Pattern matching (use % as wildcard)

**Important**: The `#contains` operator searches for exact tag names, not substrings. This is a common source of confusion.

## Building for Production

Create an optimized production build:

```bash
npm run build
```

This creates a `dist` folder with static files ready for deployment.

## Deployment Options

### Option 1: Netlify

1. Sign up for a free account at [Netlify](https://netlify.com)
2. Connect your repository or drag the `dist` folder to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Option 2: Vercel

1. Sign up for a free account at [Vercel](https://vercel.com)
2. Import your project
3. Vercel auto-detects Vite configuration
4. Deploy with one click

### Option 3: Traditional Web Server

Upload the contents of the `dist` folder to any web server (Apache, Nginx, etc.):

```bash
npm run build
# Upload the dist/ folder to your web server
```

### Option 4: GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Deploy:
```bash
npm run deploy
```

## Security Notes

- **API Key Storage**: The API key is stored only in browser memory during the session. It is NOT persisted to localStorage or cookies.
- **CORS Limitations**: Due to browser CORS policies, you may need to configure CORS on your Infobip account or use this tool from an allowed domain.
- **Production Use**: For production deployments, consider implementing a backend proxy to handle API credentials securely.

## CORS Issues

If you encounter CORS errors when testing queries:

1. **Browser Console**: Check the browser console for detailed CORS error messages
2. **Infobip Settings**: Configure allowed origins in your Infobip account settings
3. **Proxy Solution**: Set up a backend proxy to handle API requests (recommended for production)

## Development

### Project Structure

```
├── public/
│   └── index.html           # HTML entry point
├── src/
│   ├── components/
│   │   ├── ConfigSection.jsx       # API configuration inputs
│   │   ├── FilterBuilder.jsx       # Visual filter builder
│   │   ├── FilterPreview.jsx       # Filter preview display
│   │   └── ResultsPanel.jsx        # API results display
│   ├── utils/
│   │   ├── attributeFetcher.js     # Fetch attributes from API
│   │   ├── apiClient.js            # API request handling
│   │   └── filterEncoder.js        # Filter encoding logic
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.jsx             # React entry point
├── package.json             # Project dependencies
└── README.md               # This file
```

### Available Scripts

- `npm start` - Start development server
- `npm run dev` - Alternative dev server command
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Troubleshooting

### Attributes Not Loading

- Verify your API key is correct
- Check that your base URL includes the protocol (https://)
- Ensure your Infobip account has the necessary permissions
- Check browser console for detailed error messages

### Filter Not Working

- Make sure attributes are loaded before building filters
- Verify field names match your account's attribute names
- Check operator compatibility with field type
- Review the URL-encoded preview for any syntax issues

### API Test Failing

- Confirm your API key has permission to read person profiles
- Check that your filter syntax is valid
- Review error messages for specific guidance
- Test with a simpler filter first (e.g., single condition)

## Support

For issues related to:
- **This tool**: Create an issue in the repository
- **Infobip API**: Contact [Infobip Support](https://www.infobip.com/support)
- **API Documentation**: [Infobip Docs](https://www.infobip.com/docs/api)

## License

This project is provided as-is for use with Infobip APIs.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
