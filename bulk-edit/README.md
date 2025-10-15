# Bulk Staff Administration Interface

A standalone HTML page for bulk editing staff working hours and shift cycle settings in the RotaSense application.

## Overview

This is a completely independent interface that allows administrators to quickly edit multiple staff members' details without the overhead of opening individual modals in the main application. It's designed to be lightweight, functional, and easily maintainable.

## Features

- **Standalone Interface**: Independent HTML page with no Vue.js dependencies
- **Bulk Editing**: Edit multiple staff members simultaneously
- **Real-time Validation**: Inline validation for time inputs and shift cycle requirements
- **Search & Filter**: Find staff by name or filter by schedule type
- **Visual Feedback**: Clear indication of pending changes and save status
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## File Structure

```
bulk-edit/
├── index.html          # Main HTML page
├── styles.css          # Standalone CSS styling
├── script.js           # Vanilla JavaScript functionality
└── README.md           # This documentation
```

## Access

The bulk edit interface is accessible at:
- Development: `http://localhost:3000/admin/bulk-staff-edit`
- Production: `https://your-domain.com/admin/bulk-staff-edit`

## Usage

### Staff Table Columns

1. **Staff Name**: Display name (read-only)
2. **Schedule Type**: Shows DAILY or SHIFT_CYCLE (read-only)
3. **Start Time**: Editable time input for default start time
4. **End Time**: Editable time input for default end time
5. **Group Offset**: Editable number input (only for SHIFT_CYCLE staff)
6. **Zero Start Date**: Dropdown selection (only for SHIFT_CYCLE staff)
7. **Actions**: Individual save button for each row

### Editing Process

1. **Make Changes**: Click on any editable field to modify values
2. **Visual Feedback**: Changed fields are highlighted in yellow
3. **Save Options**:
   - **Individual Save**: Click "Save" button for specific staff member
   - **Bulk Save**: Click "Save All Changes" to save all pending modifications
4. **Validation**: Invalid entries (e.g., end time before start time) are prevented
5. **Feedback**: Success/error messages appear at the top of the page

### Search and Filter

- **Search**: Type in the search box to filter staff by name
- **Schedule Filter**: Use dropdown to show only DAILY or SHIFT_CYCLE staff
- **Real-time**: Results update as you type or change filters

## Technical Details

### Dependencies

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript (no frameworks)
- **Backend**: Uses existing RotaSense API endpoints
- **Database**: Connects to same MySQL database via Prisma

### API Endpoints Used

- `GET /api/staff` - Fetch all staff members
- `PUT /api/staff/:id` - Update individual staff member
- `GET /api/zero-start-dates` - Fetch available zero start dates

### Browser Compatibility

- Modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Mobile browsers (iOS Safari 12+, Chrome Mobile 60+)

## Installation

The bulk edit interface is automatically available when the RotaSense backend is running. No additional installation steps are required.

## Configuration

### API Base URL

If your backend runs on a different port or domain, update the `API_BASE` constant in `script.js`:

```javascript
const API_BASE = 'http://localhost:3000/api';  // Update this URL
```

### CORS Settings

The backend is configured to allow requests from the bulk edit page. If you encounter CORS issues, ensure the backend's CORS settings include your domain.

## Maintenance

### Adding New Fields

To add new editable fields:

1. Add column to HTML table in `index.html`
2. Add input handling in `createStaffRow()` function in `script.js`
3. Update `handleInputChange()` to handle the new field
4. Add CSS styling for the new field in `styles.css`

### Removing the Feature

To completely remove the bulk edit feature:

1. Delete the entire `bulk-edit/` directory
2. Remove the bulk edit route from `backend/src/index.ts`
3. Delete `backend/src/routes/bulk-edit.ts`

This will not affect the main RotaSense application.

## Security Considerations

- This interface has no authentication - implement access controls as needed
- All API calls use the same validation as the main application
- Input validation prevents common injection attacks
- Consider adding rate limiting for production use

## Troubleshooting

### Common Issues

1. **Page won't load**: Check that the backend server is running
2. **API errors**: Verify the API_BASE URL in script.js
3. **CORS errors**: Ensure backend CORS settings allow your domain
4. **Data not saving**: Check browser console for JavaScript errors

### Debug Mode

To enable debug logging, open browser console and run:
```javascript
localStorage.setItem('debug', 'true');
```

Then refresh the page to see detailed API request/response logs.

## Performance

- Loads all staff data on page load (consider pagination for 1000+ staff)
- Debounced search (300ms delay) to prevent excessive filtering
- Batch API calls for bulk save operations
- Minimal DOM manipulation for smooth performance

## Future Enhancements

Potential improvements that could be added:

- Pagination for large staff lists
- Export functionality (CSV/Excel)
- Undo/redo functionality
- Keyboard shortcuts for power users
- Audit trail for changes made
- Print-friendly view
