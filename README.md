# Sales Analytics Dashboard

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/tymekbielinski/sb1-etdv6vob)

## Dashboard Library Feature

The Dashboard Library is a powerful feature that allows users to create, save, and share dashboard templates. This enables teams to standardize their analytics views and share best practices across the organization.

### Key Features

1. **Template Creation**
   - Save any dashboard as a reusable template
   - Configure visibility (public/private) for sharing
   - Add descriptions and categorize templates

2. **Template Gallery**
   - Browse available templates with search and filtering
   - Preview templates before using them
   - Clone templates to create new dashboards

3. **Dashboard Management**
   - Create dashboards from templates
   - Customize dashboards with specific metrics
   - Share dashboards with team members

### Implementation Details

The Dashboard Library feature is implemented with the following components:

1. **Database Schema**
   - `dashboards`: Stores user and team dashboards with their layouts and metric configurations
   - `dashboard_templates`: Stores reusable templates that can be shared and cloned
   - Added a stored function `increment_template_downloads` to track template usage

2. **API Layer**
   - Comprehensive API functions in `src/lib/api/dashboards/templates.ts` for:
     - Creating, reading, updating, and deleting templates
     - Cloning templates into user dashboards
     - Validating template compatibility with user data
     - Managing template visibility (public/private)

3. **State Management**
   - Zustand stores for both dashboards and templates:
     - `dashboards-store.ts`: Manages user and team dashboards
     - `templates-store.ts`: Handles template operations and state

4. **UI Components**
   - Complete set of UI components:
     - `TemplateGallery`: Browse and filter available templates
     - `TemplateCard`: Display template information
     - `SaveAsTemplate`: Dialog for saving a dashboard as a template
     - `CloneTemplateDialog`: Dialog for cloning a template to a dashboard
   - Template-related pages:
     - Template gallery page
     - Template preview page
     - Create template page

5. **Testing**
   - Unit tests for data conversion between store and database
   - End-to-end tests for the full template creation and usage flow

### Getting Started

To use the Dashboard Library:

1. Navigate to your dashboard
2. Click "Save as Template" to create a new template
3. Visit the Templates page to browse available templates
4. Use "Clone Template" to create a new dashboard from a template

### Development

To run the tests for the Dashboard Library:

```bash
npm test
```

This will run both the unit tests and end-to-end tests for the dashboard template functionality.