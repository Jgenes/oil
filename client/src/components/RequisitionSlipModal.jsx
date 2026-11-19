import React from 'react';
import { Printer, Download, X, Check, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RequisitionSlipModal({ slipData, onClose }) {
  if (!slipData) return null;
  const s = slipData.slip;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.rect(10, 10, 190, 277);

    // Header Texts
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('UNITED REPUBLIC OF TANZANIA', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('MINISTRY OF EDUCATION, SCIENCE AND TECHNOLOGY', 105, 23, { align: 'center' });
    
    doc.setFontSize(13);
    doc.text('MOSHI CO-OPERATIVE UNIVERSITY (MoCU)', 105, 29, { align: 'center' });
    doc.setFontSize(11);
    doc.text('CHUO KIKUU CHA USHIRIKA MOSHI', 105, 34, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('OFFICE OF THE VICE CHANCELLOR', 105, 40, { align: 'center' });
    doc.text('06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Tanzania', 105, 44, { align: 'center' });
    doc.text('Tel: +255 272751833, Email: vc@mocu.ac.tz, Website: www.mocu.ac.tz', 105, 48, { align: 'center' });

    doc.setLineWidth(0.4);
    doc.line(15, 51, 195, 51);

    // Title & Slip No Box
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('FUEL REQUISITION FORM', 35, 60);

    // Box for Form No
    doc.rect(140, 54, 55, 10);
    doc.setFontSize(11);
    doc.text(`No:  ${s.form_number}`, 145, 61);

    // Form Details Fields
    let y = 72;
    doc.setFontSize(10.5);

    const printField = (label, value) => {
      doc.setFont('times', 'bold');
      doc.text(label, 15, y);
      doc.setFont('times', 'normal');
      doc.text(value ? String(value) : '', 75, y);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(75, y + 1, 195, y + 1);
      doc.setLineDashPattern([], 0);
      y += 8;
    };

    printField('Name of the Requisition Officer:', s.requisition_officer);
    printField('Department/ Section:', s.department_section);
    printField('Type of Fuel:', s.type_of_fuel);
    printField('Please supply the following for:', s.supply_for);
    printField('Last request Kilometer:', s.last_request_km ? `${s.last_request_km} KM` : 'N/A');
    printField('Present request kilometer:', s.present_request_km ? `${s.present_request_km} KM` : 'N/A');

    // Table of vehicles & fuel
    y += 4;
    const tableData = (s.table_items || []).map((item, idx) => [
      idx + 1,
      item.vehicle_number,
      `${item.quantity_litres} L`,
      `${Number(item.unit_price).toLocaleString()} TZS`,
      `${Number(item.total_value).toLocaleString()} TZS`
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [['S/No', 'VEHICLE NUMBER', 'QTY', 'UNIT PRICE', 'TOTAL VALUE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: 'times', fontStyle: 'bold', fontSize: 9.5 },
      styles: { font: 'times', fontSize: 9.5, textColor: [0, 0, 0], cellPadding: 3.5 }
    });

    y = doc.lastAutoTable.finalY + 12;

    // Signatures
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    // Requisition Officer Sign
    doc.text(`Date: ${s.signatures.requisition_officer.date || '..................'}`, 15, y);
    doc.text(`Sign: ${s.signatures.requisition_officer.name || '...........................................'}`, 90, y);
    y += 10;

    // Head Driver Sign
    doc.text(`Date: ${s.signatures.head_driver.date || '..................'}`, 15, y);
    doc.text(`Sign: ${s.signatures.head_driver.name ? `${s.signatures.head_driver.name} (Verified)` : '...........................................'}`, 90, y);
    doc.setFontSize(8.5);
    doc.text('Sign of Head Driver', 130, y + 4);
    doc.setFontSize(10);
    y += 10;

    // HOD Sign
    doc.text(`Date: ${s.signatures.hod.date || '..................'}`, 15, y);
    doc.text(`Sign: ${s.signatures.hod.name ? `${s.signatures.hod.name} (Recommended)` : '...........................................'}`, 90, y);
    doc.setFontSize(8.5);
    doc.text('Sign of Head of Department/Section', 130, y + 4);
    doc.setFontSize(10);
    y += 14;

    // Authorization Decision
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);
    y += 8;
    
    doc.setFont('times', 'bold');
    doc.text('I authorize / do not authorize the above mentioned fuel to be supplied', 15, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.text(`Decision Status: ${s.signatures.hpmu.decision || 'Pending'}`, 15, y);
    y += 8;

    doc.text(`Date: ${s.signatures.hpmu.date || '..................'}`, 15, y);
    doc.text(`Sign of HPMU: ${s.signatures.hpmu.name ? `${s.signatures.hpmu.name} (Signed & Sealed)` : '...........................................'}`, 90, y);
    y += 14;

    // Footer
    doc.setFontSize(8);
    doc.text('General: Moshi Co-operative University, 06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Tanzania', 105, 275, { align: 'center' });
    doc.text('Email: info@mocu.ac.tz, Website: www.mocu.ac.tz', 105, 279, { align: 'center' });

    doc.save(`MoCU_Fuel_Requisition_${s.form_number}.pdf`);
  };

  return (
    <div className="modal show fade d-block bg-dark bg-opacity-75" tabIndex="-1" style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          
          {/* Header Controls (Hidden during print) */}
          <div className="modal-header bg-primary text-white py-2.5 px-3 no-print">
            <h6 className="modal-title d-flex align-items-center gap-2">
              <span>Official MoCU Fuel Requisition Slip No. {s.form_number}</span>
              <span className="badge bg-warning text-dark">Digitalised Physical Slip</span>
            </h6>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm btn-light d-flex align-items-center gap-1.5" onClick={handlePrint}>
                <Printer size={15} />
                <span>Print Form</span>
              </button>
              <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5" onClick={handleDownloadPDF}>
                <Download size={15} />
                <span>Download PDF</span>
              </button>
              <button className="btn btn-sm btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>

          <div className="modal-body p-3 p-md-4 bg-light">
            
            {/* The Actual Requisition Slip replicating the user's photograph! */}
            <div className="paper-slip-container printable-area">
              
              {/* Header with Coat of Arms & MoCU Crest */}
              <div className="d-flex align-items-start justify-content-between mb-2">
                <img src="/coat-of-arms.svg" alt="Coat of Arms" style={{ width: '60px', height: '60px' }} />
                <div className="text-center flex-grow-1 px-2">
                  <div className="fw-bold" style={{ fontSize: '0.95rem' }}>UNITED REPUBLIC OF TANZANIA</div>
                  <div className="fw-bold text-uppercase" style={{ fontSize: '0.8rem' }}>MINISTRY OF EDUCATION, SCIENCE AND TECHNOLOGY</div>
                  <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#0B2545', marginTop: '2px' }}>
                    MOSHI CO-OPERATIVE UNIVERSITY (MoCU)
                  </div>
                  <div className="fw-bold" style={{ fontSize: '0.9rem' }}>CHUO KIKUU CHA USHIRIKA MOSHI</div>
                  <div className="fst-italic" style={{ fontSize: '0.8rem', marginTop: '2px' }}>OFFICE OF THE VICE CHANCELLOR</div>
                  <div style={{ fontSize: '0.72rem' }}>06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Tanzania</div>
                  <div style={{ fontSize: '0.72rem' }}>Tel: +255 272751833, Email: vc@mocu.ac.tz, Website: www.mocu.ac.tz</div>
                </div>
                <img src="/logo.png" alt="MoCU Crest" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
              </div>

              <hr style={{ borderTop: '2px solid #000', margin: '8px 0 16px 0' }} />

              {/* Title and Form Number Box */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>
                  FUEL REQUISITION FORM
                </h4>
                <div className="border border-2 border-dark px-3 py-1.5 fw-bold d-flex align-items-center gap-2">
                  <span>No:</span>
                  <span className="font-monospace text-danger" style={{ fontSize: '1.3rem', letterSpacing: '2px' }}>
                    {s.form_number}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="mb-2">
                <span className="fw-bold">Name of the Requisition Officer:</span>{' '}
                <span className="slip-dotted-line text-primary" style={{ minWidth: '400px' }}>
                  {s.requisition_officer || '....................................................................................'}
                </span>
              </div>

              <div className="mb-2">
                <span className="fw-bold">Department/ Section:</span>{' '}
                <span className="slip-dotted-line text-dark" style={{ minWidth: '450px' }}>
                  {s.department_section || '....................................................................................'}
                </span>
              </div>

              <div className="mb-2">
                <span className="fw-bold">Type of Fuel:</span>{' '}
                <span className="slip-dotted-line fw-bold text-uppercase" style={{ minWidth: '495px' }}>
                  {s.type_of_fuel || '....................................................................................'}
                </span>
              </div>

              <div className="mb-2">
                <span className="fw-bold">Please supply the following for:</span>{' '}
                <span className="slip-dotted-line text-secondary" style={{ minWidth: '390px' }}>
                  {s.supply_for || '....................................................................................'}
                </span>
              </div>

              <div className="mb-2">
                <span className="fw-bold">Last request Kilometer:</span>{' '}
                <span className="slip-dotted-line font-monospace" style={{ minWidth: '445px' }}>
                  {s.last_request_km ? `${Number(s.last_request_km).toLocaleString()} KM` : '....................................................................................'}
                </span>
              </div>

              <div className="mb-3">
                <span className="fw-bold">Present request kilometer:</span>{' '}
                <span className="slip-dotted-line font-monospace fw-bold" style={{ minWidth: '430px' }}>
                  {s.present_request_km ? `${Number(s.present_request_km).toLocaleString()} KM` : '....................................................................................'}
                </span>
              </div>

              {/* Table replicating photo */}
              <div className="table-responsive mb-4">
                <table className="slip-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>S/No</th>
                      <th>VEHICLE NUMBER</th>
                      <th style={{ width: '90px' }}>QTY (L)</th>
                      <th style={{ width: '130px' }}>UNIT PRICE</th>
                      <th style={{ width: '150px' }}>TOTAL VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(s.table_items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center fw-bold">{idx + 1}.</td>
                        <td className="fw-bold">{item.vehicle_number}</td>
                        <td className="text-end font-monospace">{item.quantity_litres} L</td>
                        <td className="text-end font-monospace">{Number(item.unit_price).toLocaleString()} TZS</td>
                        <td className="text-end font-monospace fw-bold">{Number(item.total_value).toLocaleString()} TZS</td>
                      </tr>
                    ))}
                    {/* Empty placeholder rows to match physical 6-row form */}
                    {Array.from({ length: Math.max(0, 4 - (s.table_items?.length || 0)) }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="text-center text-muted">{(s.table_items?.length || 0) + i + 1}.</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="mt-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="fw-bold">Date:</span>{' '}
                    <span className="slip-dotted-line" style={{ minWidth: '150px' }}>
                      {s.signatures.requisition_officer.date || '...........................'}
                    </span>
                  </div>
                  <div>
                    <span className="fw-bold">Sign:</span>{' '}
                    <span className="slip-dotted-line text-primary" style={{ minWidth: '280px' }}>
                      {s.signatures.requisition_officer.name ? `✓ ${s.signatures.requisition_officer.name}` : '................................................'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="fw-bold">Date:</span>{' '}
                    <span className="slip-dotted-line" style={{ minWidth: '150px' }}>
                      {s.signatures.head_driver.date || '...........................'}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold">Sign:</span>{' '}
                    <span className="slip-dotted-line text-success" style={{ minWidth: '280px' }}>
                      {s.signatures.head_driver.name ? `✓ ${s.signatures.head_driver.name}` : '................................................'}
                    </span>
                    <div className="fst-italic text-muted" style={{ fontSize: '0.78rem' }}>Sign of Head Driver</div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span className="fw-bold">Date:</span>{' '}
                    <span className="slip-dotted-line" style={{ minWidth: '150px' }}>
                      {s.signatures.hod.date || '...........................'}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold">Sign:</span>{' '}
                    <span className="slip-dotted-line text-primary" style={{ minWidth: '280px' }}>
                      {s.signatures.hod.name ? `✓ ${s.signatures.hod.name}` : '................................................'}
                    </span>
                    <div className="fst-italic text-muted" style={{ fontSize: '0.78rem' }}>Sign of Head of Department/Section</div>
                  </div>
                </div>

                {/* HPMU Authorization Statement */}
                <div className="pt-2 border-top border-dark mt-3">
                  <div className="fw-bold fst-italic mb-2" style={{ fontSize: '0.92rem' }}>
                    {s.signatures.hpmu.authorized ? (
                      <span className="text-success">
                        <Check size={18} className="d-inline me-1" />
                        "I authorize the above mentioned fuel to be supplied"
                      </span>
                    ) : s.signatures.hpmu.decision === 'Rejected' ? (
                      <span className="text-danger">
                        <XCircle size={18} className="d-inline me-1" />
                        "I do not authorize the above mentioned fuel to be supplied"
                      </span>
                    ) : (
                      <span>I authorize/ do not authorize the above mentioned fuel to be supplied (Pending)</span>
                    )}
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <div>
                      <span className="fw-bold">Date:</span>{' '}
                      <span className="slip-dotted-line" style={{ minWidth: '150px' }}>
                        {s.signatures.hpmu.date || '...........................'}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold">Sign of HPMU:</span>{' '}
                      <span className="slip-dotted-line fw-bold text-success" style={{ minWidth: '250px' }}>
                        {s.signatures.hpmu.name ? `✓ ${s.signatures.hpmu.name}` : '................................................'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2 border-top text-center text-muted" style={{ fontSize: '0.72rem' }}>
                General: Moshi Co-operative University, 06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Tanzania, Email: info@mocu.ac.tz, Website: www.mocu.ac.tz
              </div>

            </div>

          </div>

          <div className="modal-footer bg-light no-print py-2">
            <span className="text-muted small me-auto">
              Original paper requisition format officially digitized for Moshi Co-operative University.
            </span>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-1.5" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print Form</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
