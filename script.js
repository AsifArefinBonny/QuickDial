let currentQRCode = null;
let currentPhoneNumber = '';
let currentName = '';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('qrForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('downloadPdf').addEventListener('click', downloadPDF);
    document.getElementById('phoneNumber').addEventListener('input', formatPhoneNumber);
    document.getElementById('name').addEventListener('input', validateNameLength);
});

function handleFormSubmit(e) {
    e.preventDefault();
    generateQRCode();
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.startsWith('88')) {
        value = '+' + value;
    } else if (value.startsWith('01') && value.length === 11) {
        value = '+88' + value;
    }
    
    e.target.value = value;
}

function validateNameLength(e) {
    const maxLength = 30;
    let value = e.target.value;
    
    if (value.length > maxLength) {
        e.target.value = value.substring(0, maxLength);
        showAlert(`Name cannot exceed ${maxLength} characters`, 'warning');
    }
}

function generateQRCode() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const name = document.getElementById('name').value.trim();
    
    if (!phoneNumber) {
        showAlert('Please enter a phone number', 'danger');
        return;
    }

    // Validate name length
    if (name.length > 30) {
        showAlert('Name cannot exceed 30 characters', 'danger');
        return;
    }

    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$|^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        showAlert('Please enter a valid phone number', 'warning');
        return;
    }

    currentPhoneNumber = phoneNumber;
    currentName = name;

    // Show loading
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner"></span>Generating...';
    
    // Clear previous QR code
    document.getElementById('qrcode').innerHTML = '';
    
    setTimeout(() => {
        try {
            const qrText = `tel:${phoneNumber.replace(/[\s\-\(\)]/g, '')}`;
            
            currentQRCode = new QRCode(document.getElementById('qrcode'), {
                text: qrText,
                width: 280,
                height: 280,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            updateQRInfo();
            showResult();
            
        } catch (error) {
            showAlert('Error generating QR code. Please try again.', 'danger');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalText;
        }
    }, 1000);
}

function updateQRInfo() {
    const infoDiv = document.getElementById('qrInfo');
    infoDiv.innerHTML = `
        <div class="alert alert-success">
            <h4><i class="fas fa-mobile-alt"></i> Ready to Use!</h4>
            ${currentName ? `<strong>Name:</strong> ${currentName}<br>` : ''}
            <strong>Phone:</strong> ${currentPhoneNumber}<br>
            <small><i class="fas fa-info-circle"></i> Scan with any smartphone camera to call directly</small>
        </div>
    `;
}

function showResult() {
    document.getElementById('resultSection').classList.add('show');
    document.getElementById('resultSection').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
}

function generatePDFData() {
    if (!currentQRCode) {
        return null;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        // Page dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Add title
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('QuickDial - Parking Contact QR Code', pageWidth/2, 30, { align: 'center' });
        
        // Add website
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Generated at: asifarefinbonny.github.io/QuickDial', pageWidth/2, 40, { align: 'center' });
        
        // Add instructions
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Instructions:', 20, 60);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        const instructions = [
            '1. Cut out the dashed box section below',
            '2. Place or paste it on your car\'s windshield where it\'s visible',
            '3. Others can scan the QR code to call you directly',
            '4. No more typing mistakes or unclear handwritten numbers!'
        ];
        
        let yPos = 70;
        instructions.forEach(instruction => {
            pdf.text(instruction, 25, yPos);
            yPos += 8;
        });
        
        // Dashed box section
        const boxX = 30;
        const boxY = 120;
        const boxWidth = 150;
        const boxHeight = 120;
        
        // Draw dashed border
        pdf.setLineDashPattern([3, 3], 0);
        pdf.setLineWidth(1);
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(boxX, boxY, boxWidth, boxHeight);
        
        // Reset line style
        pdf.setLineDashPattern([], 0);
        
        // Add instruction text at top
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Please scan the QR to call.', boxX + boxWidth/2, boxY + 15, { align: 'center' });
        
        // Add QR code in center
        const qrCanvas = document.querySelector('#qrcode canvas');
        if (qrCanvas) {
            const qrImageData = qrCanvas.toDataURL('image/png');
            const qrSize = 45; // Increased size for better scanning
            const qrX = boxX + (boxWidth - qrSize) / 2; // Center horizontally
            const qrY = boxY + 25; // Position below instruction text
            pdf.addImage(qrImageData, 'PNG', qrX, qrY, qrSize, qrSize);
        }
        
        // Add contact info below QR code
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        if (currentName) {
            pdf.text(`Name: ${currentName}`, boxX + boxWidth/2, boxY + 82, { align: 'center' });
            pdf.text(`Phone: ${currentPhoneNumber}`, boxX + boxWidth/2, boxY + 88, { align: 'center' });
        } else {
            pdf.text(`Phone: ${currentPhoneNumber}`, boxX + boxWidth/2, boxY + 83, { align: 'center' });
        }
        
        // Add branding at bottom
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Generate your code at: asifarefinbonny.github.io/QuickDial', boxX + boxWidth/2, boxY + (currentName ? 105 : 100), { align: 'center' });
        
        // Add cut instruction below box
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('✂ Cut along the dashed line above and place on your car windshield', 
                 pageWidth/2, boxY + boxHeight + 15, { align: 'right' });
        
        // Add footer
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('This QR code makes contact dialing easier - no more typing phone numbers!', 
                 pageWidth/2, pageHeight - 20, { align: 'center' });
        
        return pdf;
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return null;
    }
}

function downloadPDF() {
    if (!currentQRCode) {
        showAlert('Please generate a QR code first', 'warning');
        return;
    }

    const pdf = generatePDFData();
    if (pdf) {
        const fileName = `QuickDial-${currentPhoneNumber.replace(/[^0-9]/g, '')}.pdf`;
        pdf.save(fileName);
        showAlert('PDF downloaded successfully!', 'success');
        
        // Analytics tracking
        trackEvent('PDF', 'download', fileName);
    } else {
        showAlert('Error generating PDF. Please try again.', 'danger');
    }
}

async function sharePDF() {
    if (!currentQRCode) {
        showAlert('Please generate a QR code first', 'warning');
        return;
    }

    const shareBtn = document.getElementById('sharePdfBtn');
    const originalText = shareBtn.innerHTML;
    shareBtn.disabled = true;
    shareBtn.innerHTML = '<span class="spinner"></span>Preparing...';

    try {
        const pdf = generatePDFData();
        if (!pdf) {
            throw new Error('Failed to generate PDF');
        }

        const fileName = `QuickDial-${currentPhoneNumber.replace(/[^0-9]/g, '')}.pdf`;
        const pdfBase64 = pdf.output('datauristring');

        // Check if Web Share API is supported and can share files
        if (navigator.share && navigator.canShare) {
            try {
                // Convert base64 to blob
                const response = await fetch(pdfBase64);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: 'application/pdf' });

                // Check if we can share this file
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'QuickDial QR Code',
                        text: `My parking contact quick dialing QR code - scan to call ${currentPhoneNumber}`,
                        files: [file]
                    });
                    
                    showAlert('PDF shared successfully!', 'success');
                    trackEvent('PDF', 'share_native', fileName);
                    return;
                }
            } catch (shareError) {
                console.log('Native sharing failed, falling back to download:', shareError);
            }
        }

        // Fallback: Download the file
        pdf.save(fileName);
        
        // Show instructional message for sharing
        showAlert('PDF downloaded! You can now share it via WhatsApp, email, or any app from your device.', 'info');
        trackEvent('PDF', 'share_download', fileName);

    } catch (error) {
        console.error('Share PDF Error:', error);
        showAlert('Error preparing PDF for sharing. Please try again.', 'danger');
    } finally {
        shareBtn.disabled = false;
        shareBtn.innerHTML = originalText;
    }
}

function generateNew() {
    document.getElementById('qrForm').reset();
    document.getElementById('resultSection').classList.remove('show');
    document.getElementById('qrForm').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    document.getElementById('phoneNumber').focus();
}

function toggleInstructions() {
    const instructions = document.getElementById('instructions');
    instructions.classList.toggle('show');
}

function showAlert(message, type = 'info') {
    // Remove any existing alerts first
    const existingAlerts = document.querySelectorAll('.alert:not(.alert-success)');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i> ${message}
    `;
    
    // Try multiple fallback locations for inserting the alert
    const formSection = document.querySelector('.form-section');
    const formTitle = document.querySelector('.form-title');
    const qrForm = document.getElementById('qrForm');
    const body = document.body;
    
    if (formSection && formTitle) {
        // Original approach - insert after form title
        formSection.insertBefore(alertDiv, formTitle.nextSibling);
    } else if (formSection) {
        // Fallback 1 - insert as first child of form section
        formSection.insertBefore(alertDiv, formSection.firstChild);
    } else if (qrForm) {
        // Fallback 2 - insert before the form
        qrForm.parentNode.insertBefore(alertDiv, qrForm);
    } else {
        // Fallback 3 - insert at top of body
        body.insertBefore(alertDiv, body.firstChild);
    }
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        danger: 'times-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Google Analytics tracking
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}