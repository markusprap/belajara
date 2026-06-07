# Original User Request

## Initial Request — 2026-06-07T11:42:22Z

The project aims to refactor the AI transcript/curriculum analysis feature (eksplorasi AI) to ensure it strictly extracts academic progress from the uploaded document, dynamically resolves the correct study program, and accurately maps competencies without defaulting to incorrect stubs or hallucinated subjects.

Working directory: /home/markusprap/01-Projects/Belajara
Integrity mode: development

## Requirements

### R1. Dinamika Program Studi (Study Program Detection)
AI transcript/curriculum analysis must dynamically detect and parse the student's study program (jurusan) from the text of the uploaded academic document (e.g., detecting "Sistem Informasi", "Akuntansi", etc.) instead of defaulting to the logged-in student's default jurusan or using a fallback if they mismatch. If no program study is found in the document, use the provided `target_prodi` or student's registered jurusan.

### R2. Strict Transcript Subject Extraction
Ensure that the AI model only identifies and extracts subjects (`completed_subjects`) that are actually present in the uploaded academic document with passing grades. The AI must not hallucinate or return a predefined/mock list of subjects if those subjects do not appear in the uploaded document.

### R3. Dynamic Competency Axis and Evidence
The competency scores (`competency_scores`), axis labels (`competency_axis_labels`), and competency evidence (`competency_evidence`) returned by the AI must correspond exactly to the detected study program and the actual courses listed in the document. For instance, an Accounting student must have Accounting dimensions and evidence matching their Accounting courses, while a Systems Information student must have Systems Information dimensions.

## Acceptance Criteria

### Functional Verification
- [ ] When uploading an Accounting transcript, the response contains accounting competency dimensions (e.g. `financial_accounting`, `managerial_accounting`, etc.) and completed subjects matching the PDF content.
- [ ] When uploading a Systems Information transcript, the response contains systems information competency dimensions (e.g. `data_analytics`, `enterprise_architecture`, etc.) and completed subjects matching the PDF content.
- [ ] All mock fallback data/recommendations are completely bypassed, and real API analysis is executed correctly using the provided Gemini model config.
- [ ] No instructor credits are deducted if the API call fails or encounters errors.

## Follow-up — 2026-06-07T11:44:05Z

The implementation plan is approved. Please proceed with the execution phase.

## Follow-up — 2026-06-07T11:53:21Z

Please resume your work and continue executing the implementation plan.
