# 7. DETAILED SYSTEM DESIGN

## 7.1 Classification

The Equipment Reservation System is composed of several key SPFx webparts and their supporting components:

- **Webparts (Top-level Components)**
  - NewEquipmentReservationWebPart
  - DisplayNewEquipmentRequestWebPart
  - ViewNewEquipmentRequestWebPart
  - ResReservationWebPart

- **Component Types**
  - React Components (.tsx files)
  - Service Classes (.ts files)
  - Utility Modules (.ts files)
  - Style Modules (.scss files)
  - Localization Files (.js files)

## 7.2 Definition

The system is a SharePoint Framework-based equipment reservation management solution designed to handle equipment bookings and requests. Its primary purposes are:

1. Equipment Reservation Management
2. Request Display and Tracking
3. Approval Workflow Management
4. Equipment Availability Management
5. Request Status Updates

## 7.3 Responsibilities

### NewEquipmentReservationWebPart
- Handles the creation of new equipment reservations
- Manages equipment selection and validation
- Processes reservation form submissions
- Handles data persistence to SharePoint lists

### DisplayNewEquipmentRequestWebPart
- Displays existing equipment requests
- Provides detailed request information
- Manages request status updates
- Handles file attachments if any

### ViewNewEquipmentRequestWebPart
- Manages approval workflows
- Provides different views based on user roles
- Handles request modifications
- Manages request status updates

### ResReservationWebPart
- Handles general resource reservations
- Manages facility bookings
- Processes reservation requests
- Handles form validation and submission

## 7.4 Constraints

1. **Technical Constraints**
   - Must run within SharePoint Framework environment
   - Compatible with SharePoint Online
   - Follows Microsoft 365 authentication protocols

2. **Operational Constraints**
   - Single equipment reservation per time slot
   - Approval required for specific equipment types
   - Equipment availability validation
   - Time slot validation:
     * No overlapping reservations allowed
     * Dates must be in ISO format
   - Department-specific constraints:
     * Users must belong to valid departments
     * Principal user validation per department
   - Equipment-specific constraints:
     * Availability status
     * Maintenance schedules
     * Usage restrictions

## 7.5 Composition

### NewEquipmentReservation Component Structure
- FormComponents
- EquipmentDialog
- EquipmentList
- ConfirmationDialog
- ModalPopup
- Notification

### DisplayNewEquipmentRequest Component Structure
- BasicInformation
- EquipmentDetails
- RequestStatus
- Notification

### ViewNewEquipmentRequest Component Structure
- RequestList
- ApprovalForm
- StatusUpdates
- Notifications

## 7.6 Uses/Interactions

### Component Interactions
1. **SharePointService**
   - Used by all webparts for data operations
   - Handles CRUD operations with SharePoint lists
   - Manages equipment status updates

2. **Common Components**
   - Shared across multiple webparts
   - Provides consistent UI/UX
   - Handles common functionalities

3. **Helper Utilities**
   - Provides shared validation logic
   - Handles date-time formatting
   - Manages common helper functions

## 7.7 Resources

1. **SharePoint Resources**
   - SharePoint Lists:
     * EquipmentRequest - Stores equipment request data
     * Equipment - Manages equipment information
     * UsersPerDepartment - Maps users to departments
     * Department - Stores department information
     * RequestDocs - Handles document attachments
   - SharePoint REST API (@pnp/sp)
   - SharePoint Utilities for notifications

2. **External Resources**
   - SharePoint User Profiles
   - Active Directory integration
   - Email service for notifications:
     * Approval notifications
     * Request status updates
     * Equipment availability updates

## 7.8 Processing

### Equipment Reservation Flow
1. User inputs reservation details:
   - Basic information (requestor, department)
   - Equipment selection
   - Date and time preferences
   - Purpose of use
   - Additional requirements

2. System performs validations:
   - Checks equipment availability
   - Validates time slot conflicts
   - Verifies user permissions
   - Ensures all required fields are filled

3. Data Processing:
   - Formats dates to ISO format
   - Processes equipment data
   - Handles request serialization
   - Updates equipment status

4. SharePoint Operations:
   - Creates request item in EquipmentRequest list
   - Updates equipment availability
   - Updates related information
   - Triggers notifications

### Approval Process Flow
1. Approver reviews equipment request
2. System validates equipment availability
3. Updates equipment allocation if approved
4. Processes approval/disapproval status
5. Sends notifications to requestor
6. Updates SharePoint list with final status

## 7.9 Interface/Exports

### SharePointService Interface
```typescript
class SharePointService {
  // User Management
  getLoggedinUser(): Promise<any>;
  getPrincipalUser(dept: string): Promise<any>;
  
  // Equipment Management
  getEquipmentDetails(id: string): Promise<{
    equipmentImage: string;
    specifications: any;
    availability: boolean;
    equipmentId: string;
  }>;
  getEquipmentList(): Promise<any[]>;
  
  // Request Management
  getRequestById(id: string): Promise<any>;
  updateRequest(id: string, formData: any, status: string): Promise<void>;
  
  // Availability Management
  checkEquipmentAvailability(equipmentId: string, fromDate: string, toDate: string): Promise<boolean>;
  updateEquipmentStatus(id: string, status: string): Promise<void>;
  
  // Resource Management
  getDepartments(email: string): Promise<{deparmentData: any[], deparmentList: any[]}>;
  getFiles(guid: string): Promise<any[]>;
  
  // Communication
  sendNotification(to: string[], cc: string[], data: any, type: string): Promise<void>;
}
```

### Component Props Interfaces
```typescript
interface INewEquipmentReservationProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}

interface IDisplayNewEquipmentRequestProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}
```

## 7.10 Detailed Subsystem Design

### Equipment Reservation Subsystem
The reservation subsystem handles the core equipment booking functionality:

1. **Form Management**
   - Implements multi-step form logic
   - Handles form state management
   - Provides validation at each step

2. **Data Processing**
   - Formats input data
   - Validates against business rules
   - Handles submission to SharePoint

3. **UI Components**
   - Implements responsive design
   - Provides real-time validation
   - Handles user interactions

4. **Integration Points**
   - SharePoint list operations
   - Equipment status updates
   - Notification triggers

### Request Views Subsystem
The views subsystem manages request display and approval:

1. **View Management**
   - Different views based on user roles
   - Filtering and sorting capabilities
   - Status tracking and updates

2. **Approval Workflow**
   - Approval status management
   - Comment handling
   - Status update notifications

3. **Data Display**
   - Tabular data presentation
   - Detail view implementation
   - Export capabilities
