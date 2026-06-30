<?php
/**
 * FILE: soap/MedicalService.php
 * DESC: PHP class backing the Shelter of Light SOAP web service.
 *       The SoapServer in soap_server.php maps incoming SOAP operations
 *       to methods of this class.
 *
 *  Operation:  GetMedicalHistory
 *  Input:      int  $rescue_id
 *  Output:     string — a well-formed XML document validated against
 *                       medical_export.xsd and medical_export.dtd.
 *
 * The XML response structure:
 *   <MedicalHistoryResponse xmlns="...">
 *     <RescueID>…</RescueID>
 *     <RescueName>…</RescueName>
 *     <Species>…</Species>
 *     <Records>
 *       <Record>
 *         <RecordID>…</RecordID>
 *         <TreatmentDate>…</TreatmentDate>
 *         <Diagnosis>…</Diagnosis>
 *         <ClinicName>…</ClinicName>
 *         <Veterinarian>…</Veterinarian>
 *       </Record>
 *       …
 *     </Records>
 *   </MedicalHistoryResponse>
 */

require_once __DIR__ . '/../db_connect.php';

class MedicalService
{
    /** @var PDO */
    private PDO $pdo;

    /**
     * The SoapServer calls the constructor automatically when setClass() is used.
     * We re-establish the PDO connection here because the SoapServer instantiates
     * this class fresh for every request.
     */
    public function __construct()
    {
        global $pdo;
        // Reuse the global $pdo set by db_connect.php (already included via soap_server.php)
        $this->pdo = $pdo;
    }

    // =========================================================================
    // SOAP Operation: GetMedicalHistory
    // =========================================================================
    /**
     * Accepts a Rescue_ID, queries Medical_Records joined with Clinics,
     * and returns a formatted XML string.
     *
     * @param  int    $rescue_id  The Rescue_ID to look up.
     * @return string             XML payload conforming to medical_export.xsd.
     */
    public function GetMedicalHistory(int $rescue_id): string
    {
        // ── Validate input ────────────────────────────────────────────────────
        if ($rescue_id <= 0) {
            return $this->build_error_xml('Invalid Rescue ID provided.');
        }

        // ── Fetch the rescue's basic info ─────────────────────────────────────
        $stmt = $this->pdo->prepare('
            SELECT Rescue_ID, Name, Species
            FROM   Rescues
            WHERE  Rescue_ID = ?
            LIMIT  1
        ');
        $stmt->execute([$rescue_id]);
        $rescue = $stmt->fetch();

        if (!$rescue) {
            return $this->build_error_xml("No rescue found for ID {$rescue_id}.");
        }

        // ── Fetch the full medical history joined with Clinics ────────────────
        $stmt = $this->pdo->prepare('
            SELECT
                mr.Record_ID,
                mr.Treatment_Date,
                mr.Diagnosis,
                COALESCE(c.Clinic_Name,   \'N/A\') AS ClinicName,
                COALESCE(c.Veterinarian,  \'N/A\') AS Veterinarian
            FROM  Medical_Records mr
            LEFT JOIN Clinics c ON c.Clinic_ID = mr.Clinic_ID
            WHERE mr.Rescue_ID = ?
            ORDER BY mr.Treatment_Date DESC
        ');
        $stmt->execute([$rescue_id]);
        $records = $stmt->fetchAll();

        // ── Build the XML document ────────────────────────────────────────────
        return $this->build_response_xml($rescue, $records);
    }

    // =========================================================================
    // PRIVATE: Build the conformant XML response
    // =========================================================================
    private function build_response_xml(array $rescue, array $records): string
    {
        // Use DOMDocument for properly escaped, well-formed output
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        // Root element with namespace matching the XSD targetNamespace
        $root = $dom->createElementNS(
            'http://shelteroflight.com/medical',
            'MedicalHistoryResponse'
        );
        $dom->appendChild($root);

        // Animal metadata
        $this->appendText($dom, $root, 'RescueID',   (string)$rescue['Rescue_ID']);
        $this->appendText($dom, $root, 'RescueName', $rescue['Name']);
        $this->appendText($dom, $root, 'Species',    $rescue['Species'] ?? 'Unknown');

        // Records container
        $recordsNode = $dom->createElement('Records');
        $root->appendChild($recordsNode);

        foreach ($records as $rec) {
            $recordNode = $dom->createElement('Record');
            $recordsNode->appendChild($recordNode);

            $this->appendText($dom, $recordNode, 'RecordID',      (string)$rec['Record_ID']);
            $this->appendText($dom, $recordNode, 'TreatmentDate', $rec['Treatment_Date']);
            $this->appendText($dom, $recordNode, 'Diagnosis',     $rec['Diagnosis'] ?? '');
            $this->appendText($dom, $recordNode, 'ClinicName',    $rec['ClinicName']);
            $this->appendText($dom, $recordNode, 'Veterinarian',  $rec['Veterinarian']);
        }

        return $dom->saveXML();
    }

    // =========================================================================
    // PRIVATE: Build an error XML payload
    // =========================================================================
    private function build_error_xml(string $message): string
    {
        $dom  = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        $root = $dom->createElementNS(
            'http://shelteroflight.com/medical',
            'MedicalHistoryResponse'
        );
        $dom->appendChild($root);

        $this->appendText($dom, $root, 'RescueID',   '0');
        $this->appendText($dom, $root, 'RescueName', 'ERROR');
        $this->appendText($dom, $root, 'Species',    'ERROR');

        $recordsNode = $dom->createElement('Records');
        $root->appendChild($recordsNode);

        // An error note inside a Record element keeps it schema-valid
        $errNode = $dom->createElement('Record');
        $recordsNode->appendChild($errNode);
        $this->appendText($dom, $errNode, 'RecordID',      '0');
        $this->appendText($dom, $errNode, 'TreatmentDate', date('Y-m-d'));
        $this->appendText($dom, $errNode, 'Diagnosis',     $message);
        $this->appendText($dom, $errNode, 'ClinicName',    'N/A');
        $this->appendText($dom, $errNode, 'Veterinarian',  'N/A');

        return $dom->saveXML();
    }

    // =========================================================================
    // PRIVATE: Append a text child element to a parent node
    // =========================================================================
    private function appendText(DOMDocument $dom, DOMNode $parent, string $tag, string $value): void
    {
        $el = $dom->createElement($tag);
        $el->appendChild($dom->createTextNode($value));
        $parent->appendChild($el);
    }
}