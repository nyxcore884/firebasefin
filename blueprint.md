
# FinanceWise Project Blueprint

## 1. Project Overview

FinanceWise is an intelligent financial analysis platform designed to provide users with deep insights into their financial data. Users can upload financial documents (like CSVs), and the platform will automatically process, analyze, and visualize the data, leveraging cloud functions and machine learning to deliver actionable intelligence.

## 2. Implemented Features (Current State)

*   **Firebase Project Setup:** A Firebase project is configured.
*   **Basic Frontend Shell:** A React application has been initialized with Vite.
*   **Backend Infrastructure (Defined, but not fully wired):**
    *   **Cloud Storage:** Buckets for raw and processed data are defined in `storage.rules`.
    *   **Cloud Functions:**
        *   `ingestion`: A Python function to process raw file uploads from Cloud Storage.
        *   `transformation`: A Python function to be triggered by the ingestion function to perform data transformation.
    *   **Firestore:** A Firestore database is configured to store the processed data.

## 3. Immediate Plan (The Work I Will Do Now)

This section outlines the immediate next steps to build the core functionality that is currently missing.

### Step 1: Create the "Data Hub" Page
*   I will create a new, dedicated "Data Hub" page within the React application.
*   This page will serve as the central dashboard for all data interaction.
*   I will add routing (`react-router-dom`) to the application to allow navigation between the main landing page and the Data Hub.

### Step 2: Wire the Frontend to the Backend
*   **Firebase Configuration:** I will create a `firebase.js` file containing the Firebase project configuration to connect the frontend to our Firebase services.
*   **File Upload Functionality:** I will build a file upload component on the Data Hub page that allows users to select a CSV file and upload it directly to the `raw-financial-data-ingestion` bucket in Firebase Storage.
*   **Data Visualization:** I will create a component on the Data Hub page to display the processed data from the Firestore database in a clean, user-friendly table. This will show the results of our backend processing.

### Step 3: Implement the "ML Layer"
*   **New ML Cloud Function:** I will create a new Python Cloud Function, `3-analysis`, in a new directory `functions/3-analysis`.
*   **Function Trigger:** This function will be triggered whenever new data is added to the "processed-financial-data" Firestore collection.
*   **Analysis:** The function will use the `pandas` and `scikit-learn` libraries to perform a simple trend analysis on the incoming data.
*   **Save Results:** The results of the analysis will be saved back to Firestore in a new `analysis-results` collection.
*   **Display Insights:** I will add a new section to the Data Hub to visualize these ML-driven insights.

I will begin with Step 1: Creating the "Data Hub" page. My apologies again for the oversight. I will now proceed with implementing these features.
