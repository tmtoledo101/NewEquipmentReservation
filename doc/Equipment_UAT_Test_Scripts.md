# UAT Test Scripts for Equipment Reservation System

## Test Script Format
- Test Case ID: Unique identifier for each test case
- Module: The webpart being tested
- Test Case Description: What is being tested
- Test Steps: Detailed steps to perform the test
- Test Data: Sample data to use for testing
- Expected Result: What should happen
- Actual Result: To be filled during testing
- Status: Pass/Fail (To be filled during testing)
- Comments: Any additional notes or observations

## 1. NewEquipmentReservation WebPart Test Cases

###     
- **Test Case Description**: Create a new basic equipment reservation
- **Test Steps**:
  1. Navigate to the equipment reservation page
  2. Fill in Basic Information section:
     - Purpose of reservation
     - Department
     - Contact information
  3. Select Equipment:
     - Open equipment dialog
     - Select equipment items
     - Add quantities
  4. Fill in Date/Time section:
     - Select start date and time
     - Select end date and time
  5. Click Submit
- **Test Data**:
  - Purpose: "Lab Testing"
  - Department: "R&D"
  - Contact: "John Doe"
  - Equipment: "Microscope"
  - Quantity: 2
  - Start Date: [Current Date + 1]
  - Start Time: 09:00 AM
  - End Time: 05:00 PM
- **Expected Result**: Equipment reservation should be created successfully with confirmation message

### TC-NER-002: Multiple Equipment Selection
- **Test Case Description**: Create reservation with multiple equipment items
- **Test Steps**:
  1. Follow steps 1-2 from TC-NER-001
  2. Click "Add Equipment"
  3. Select multiple equipment items
  4. Set quantities for each
  5. Complete reservation
- **Test Data**:
  - Basic reservation data from TC-NER-001
  - Equipment Items:
    * Microscope (2 units)
    * Test Tubes (10 units)
    * Digital Scale (1 unit)
- **Expected Result**: Reservation should be created with all selected equipment items

### TC-NER-003: Form Validation
- **Test Case Description**: Test form validation rules
- **Test Steps**:
  1. Submit form without required fields
  2. Enter invalid data formats
  3. Test date/time validations
  4. Test equipment quantity validations
- **Test Data**:
  - Empty required fields
  - Past dates
  - Invalid time combinations
  - Zero or negative quantities
- **Expected Result**: Appropriate validation messages should be displayed

### TC-NER-004: Equipment Search and Filter
- **Test Case Description**: Test equipment search functionality
- **Test Steps**:
  1. Open equipment dialog
  2. Use search function
  3. Apply filters
  4. Select equipment from filtered results
- **Test Data**:
  - Search terms: "microscope", "lab"
  - Filter criteria: Category, Availability
- **Expected Result**: Search results should match criteria and be selectable

### TC-NER-005: Notification Handling
- **Test Case Description**: Test notification system
- **Test Steps**:
  1. Submit successful reservation
  2. Test validation error notifications
  3. Test system error notifications
  4. Verify notification dismissal
- **Test Data**:
  - Valid and invalid form submissions
  - Network error scenarios
- **Expected Result**: Appropriate notifications should display and be dismissable

## 2. DisplayNewEquipmentRequest WebPart Test Cases

### TC-DER-001: View Equipment Request Details
- **Test Case Description**: View details of an existing equipment request
- **Test Steps**:
  1. Navigate to display page
  2. Locate specific equipment request
  3. View all request details
  4. Verify equipment list display
- **Test Data**:
  - Use reservation created in TC-NER-001
- **Expected Result**: All request details should be displayed correctly

### TC-DER-002: Equipment Status Updates
- **Test Case Description**: Test equipment status update functionality
- **Test Steps**:
  1. Open equipment request
  2. View current status
  3. Update equipment status
  4. Save changes
- **Test Data**:
  - Status changes: Available → Reserved → In Use
- **Expected Result**: Status should update successfully with timestamp

### TC-DER-003: File Attachment Handling
- **Test Case Description**: Test file attachment features
- **Test Steps**:
  1. Open equipment request
  2. Upload documentation
  3. View attached files
  4. Download attachments
  5. Delete attachments
- **Test Data**:
  - PDF documents
  - Image files
  - Maximum file size tests
- **Expected Result**: Files should be manageable and accessible

## 3. ViewNewEquipmentRequest WebPart Test Cases

### TC-VER-001: Equipment Request List View
- **Test Case Description**: Test equipment request list functionality
- **Test Steps**:
  1. Navigate to view page
  2. Test list sorting
  3. Apply filters
  4. Test pagination
- **Test Data**:
  - Multiple equipment requests
  - Different status states
- **Expected Result**: List should be sortable and filterable

### TC-VER-002: Search Functionality
- **Test Case Description**: Test search capabilities
- **Test Steps**:
  1. Use search form
  2. Test different search criteria
  3. Verify search results
- **Test Data**:
  - Equipment names
  - Department names
  - Date ranges
- **Expected Result**: Search should return relevant results

### TC-VER-003: Equipment Reservation Form
- **Test Case Description**: Test equipment reservation form in view mode
- **Test Steps**:
  1. Open reservation form
  2. Test all form fields
  3. Verify equipment selection
  4. Test date/time picker
- **Test Data**:
  - Various equipment combinations
  - Different time slots
- **Expected Result**: Form should function correctly in view mode

### TC-VER-004: Custom Table Features
- **Test Case Description**: Test custom table functionality
- **Test Steps**:
  1. Test column sorting
  2. Apply filters
  3. Test row selection
  4. Export data
- **Test Data**:
  - Multiple data rows
  - Different data types
- **Expected Result**: Table features should work as expected

### TC-VER-005: Date/Time Filter
- **Test Case Description**: Test date/time filtering
- **Test Steps**:
  1. Set date range filter
  2. Apply time filters
  3. Clear filters
  4. Verify results
- **Test Data**:
  - Various date ranges
  - Time slot combinations
- **Expected Result**: Results should match selected date/time criteria

## Additional Test Considerations

1. Performance Testing:
   - Load time for equipment lists
   - Form submission response time
   - Search operation performance
   - File upload/download speed

2. Security Testing:
   - Permission levels for different roles
   - Data access controls
   - Input sanitization
   - File upload security

3. Integration Testing:
   - SharePoint list integration
   - User profile service
   - Equipment inventory system
   - Notification system

4. Browser Compatibility:
   - Chrome
   - Edge
   - Firefox
   - Safari

## Notes for Test Execution
1. Each test case should be executed in a controlled environment
2. Document any deviations from expected results
3. Include screenshots for visual verification
4. Note system performance metrics
5. Record any browser-specific issues

## Excel Import Format
1. Columns for tracking:
   - Test Case ID
   - Module
   - Description
   - Steps
   - Test Data
   - Expected Result
   - Actual Result
   - Status
   - Tester
   - Test Date
   - Environment
   - Build Version
   - Comments
