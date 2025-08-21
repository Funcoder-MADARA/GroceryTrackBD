import jsPDF from 'jspdf';

export interface OrderPDFData {
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  shopkeeper: {
    name: string;
    shopName?: string;
    email?: string;
    phone?: string;
    area?: string;
    address?: string;
    city?: string;
  };
  company: {
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    totalPrice: number;
  }[];
  deliveryDetails: {
    deliveryArea: string;
    deliveryAddress: string;
    deliveryCity: string;
    paymentMethod: string;
    preferredDeliveryDate: string;
    deliveryInstructions?: string;
  };
  pricing: {
    subtotal: number;
    tax: number;
    delivery: number;
    total: number;
  };
}

export const generateOrderPDF = (orderData: OrderPDFData): void => {
  const doc = new jsPDF();
  
  // Set up fonts and colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue-600
  const secondaryColor: [number, number, number] = [75, 85, 99]; // Gray-600
  const accentColor: [number, number, number] = [34, 197, 94]; // Green-500
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to add text with automatic line wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.3));
  };
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Order Transcript', margin, yPosition);
  yPosition += 15;
  
  // Order info section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Order Information', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Order Number: ${orderData.orderNumber}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Date Created: ${new Date(orderData.createdAt).toLocaleDateString()}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Status: ${orderData.status.toUpperCase()}`, margin, yPosition);
  yPosition += 15;
  
  // Shopkeeper information
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Shopkeeper Information', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Name: ${orderData.shopkeeper.name}`, margin, yPosition);
  yPosition += 7;
  if (orderData.shopkeeper.shopName) {
    doc.text(`Shop Name: ${orderData.shopkeeper.shopName}`, margin, yPosition);
    yPosition += 7;
  }
  if (orderData.shopkeeper.email) {
    doc.text(`Email: ${orderData.shopkeeper.email}`, margin, yPosition);
    yPosition += 7;
  }
  if (orderData.shopkeeper.phone) {
    doc.text(`Phone: ${orderData.shopkeeper.phone}`, margin, yPosition);
    yPosition += 7;
  }
  if (orderData.shopkeeper.area) {
    doc.text(`Area: ${orderData.shopkeeper.area}`, margin, yPosition);
    yPosition += 7;
  }
  if (orderData.shopkeeper.address) {
    yPosition = addWrappedText(`Address: ${orderData.shopkeeper.address}`, margin, yPosition, contentWidth);
    yPosition += 3;
  }
  if (orderData.shopkeeper.city) {
    doc.text(`City: ${orderData.shopkeeper.city}`, margin, yPosition);
    yPosition += 7;
  }
  yPosition += 8;
  
  // Company information
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Company Information', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Company Name: ${orderData.company.companyName || orderData.company.name}`, margin, yPosition);
  yPosition += 7;
  if (orderData.company.email) {
    doc.text(`Email: ${orderData.company.email}`, margin, yPosition);
    yPosition += 7;
  }
  if (orderData.company.phone) {
    doc.text(`Phone: ${orderData.company.phone}`, margin, yPosition);
    yPosition += 7;
  }
  yPosition += 8;
  
  // Order items
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Order Items', margin, yPosition);
  yPosition += 10;
  
  // Table headers
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const tableHeaders = ['Product', 'Qty', 'Unit', 'Price', 'Total'];
  const columnWidths = [90, 25, 25, 35, 35];
  let xPosition = margin;
  
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += columnWidths[index];
  });
  yPosition += 8;
  
  // Table content
  doc.setFontSize(8);
  orderData.items.forEach((item) => {
    xPosition = margin;
    
    // Product name (with wrapping if needed)
    const productLines = doc.splitTextToSize(item.productName, columnWidths[0] - 5);
    doc.text(productLines, xPosition, yPosition);
    xPosition += columnWidths[0];
    
    // Quantity
    doc.text(item.quantity.toString(), xPosition, yPosition);
    xPosition += columnWidths[1];
    
    // Unit
    doc.text(item.unit, xPosition, yPosition);
    xPosition += columnWidths[2];
    
    // Unit price
    doc.text(`৳${item.unitPrice.toFixed(2)}`, xPosition, yPosition);
    xPosition += columnWidths[3];
    
    // Total price
    doc.text(`৳${item.totalPrice.toFixed(2)}`, xPosition, yPosition);
    
    yPosition += Math.max(7, productLines.length * 4);
  });
  
  yPosition += 10;
  
  // Delivery details
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Delivery Details', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Area: ${orderData.deliveryDetails.deliveryArea}`, margin, yPosition);
  yPosition += 7;
  yPosition = addWrappedText(`Address: ${orderData.deliveryDetails.deliveryAddress}`, margin, yPosition, contentWidth);
  yPosition += 3;
  doc.text(`City: ${orderData.deliveryDetails.deliveryCity}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Payment Method: ${orderData.deliveryDetails.paymentMethod.replace('_', ' ').toUpperCase()}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Preferred Delivery Date: ${new Date(orderData.deliveryDetails.preferredDeliveryDate).toLocaleDateString()}`, margin, yPosition);
  yPosition += 7;
  if (orderData.deliveryDetails.deliveryInstructions) {
    yPosition = addWrappedText(`Instructions: ${orderData.deliveryDetails.deliveryInstructions}`, margin, yPosition, contentWidth);
    yPosition += 3;
  }
  yPosition += 8;
  
  // Pricing summary
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Pricing Summary', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Subtotal: ৳${orderData.pricing.subtotal.toFixed(2)}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Tax (5%): ৳${orderData.pricing.tax.toFixed(2)}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Delivery Charge: ৳${orderData.pricing.delivery.toFixed(2)}`, margin, yPosition);
  yPosition += 7;
  
  // Total amount (highlighted)
  doc.setFontSize(12);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`TOTAL AMOUNT: ৳${orderData.pricing.total.toFixed(2)}`, margin, yPosition);
  yPosition += 15;
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const footerText = `Generated on ${new Date().toLocaleString()} | GroceryTrack BD`;
  doc.text(footerText, margin, doc.internal.pageSize.getHeight() - 20);
  
  // Save the PDF
  const fileName = `Order_${orderData.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
