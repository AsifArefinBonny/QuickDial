// Configuration
const SMTP_CONFIG = {
    Host: "smtp.gmail.com",
    Username: "your-email@gmail.com",
    Password: "your-app-password",
    Port: 587
};

let currentQRCode = null;
let currentPhoneNumber = '';
let currentName = '';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('qrForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('downloadPdf').addEventListener('click', downloadPDF);
    document.getElementById('phoneNumber').addEventListener('input', formatPhoneNumber);
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

function generateQRCode() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const name = document.getElementById('name').value.trim();
    
    if (!phoneNumber) {
        showAlert('Please enter a phone number', 'danger');
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

function downloadPDF() {
    if (!currentQRCode) {
        showAlert('Please generate a QR code first', 'warning');
        return;
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
        pdf.text('Generated at: quickdial.github.io', pageWidth/2, 40, { align: 'center' });
        
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
        pdf.text('Generate your code at quickdial.github.io', boxX + boxWidth/2, boxY + (currentName ? 105 : 100), { align: 'center' });
        
        // Add cut instruction below box
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('✂ Cut along the dashed line above and place on your car windshield', 
                 pageWidth/2, boxY + boxHeight + 15, { align: 'right' });
        
        // Add footer
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('This QR code makes parking easier in Bangladesh - no more typing phone numbers!', 
                 pageWidth/2, pageHeight - 20, { align: 'center' });
        
        // Save PDF
        pdf.save(`QuickDial-${currentPhoneNumber.replace(/[^0-9]/g, '')}.pdf`);
        
        showAlert('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Error:', error);
        showAlert('Error generating PDF. Please try again.', 'danger');
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

function openEmailModal() {
    if (!currentQRCode) {
        showAlert('Please generate a QR code first', 'warning');
        return;
    }
    document.getElementById('emailModal').classList.add('show');
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('show');
}

async function sendEmail() {
    const emailAddress = document.getElementById('emailAddress').value.trim();
    const emailMessage = document.getElementById('emailMessage').value.trim();
    
    if (!emailAddress) {
        showAlert('Please enter an email address', 'warning');
        return;
    }

    const sendBtn = document.getElementById('sendEmailBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner"></span>Sending...';

    try {
        // Generate PDF as base64 (same logic as download but return as base64)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        // Same PDF generation code as downloadPDF function
        // ... (PDF generation code here)
        
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        await Email.send({
            ...SMTP_CONFIG,
            To: emailAddress,
            Subject: "Your QuickDial QR Code",
            Body: emailMessage || `Your QuickDial QR code is attached. Print and place on your car windshield for easy parking contact.`,
            Attachments: [{
                name: `QuickDial-${currentPhoneNumber.replace(/[^0-9]/g, '')}.pdf`,
                data: pdfBase64
            }]
        });

        showAlert('Email sent successfully!', 'success');
        closeEmailModal();
        
    } catch (error) {
        console.error('Email error:', error);
        showAlert('Failed to send email. Please check your configuration.', 'danger');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
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

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeEmailModal();
    }
});