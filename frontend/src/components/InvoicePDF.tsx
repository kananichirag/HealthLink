'use client';

import React, { useState, useCallback } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { useSaleInvoice, useSendBill } from '@/hooks/usePharmacyQueries';

// ── Types ──

export interface InvoiceItem {
  name: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  pharmacyName: string;
  pharmacyAddress: string;
  invoiceNumber: string;
  date: string;
  patientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gst: number;
  finalAmount: number;
  paymentMethod: string;
}

export type InvoiceFormat = 'detailed' | 'compact';

// ── PDF Styles ──

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10 },
  pharmacyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  pharmacyAddress: { fontSize: 9, color: '#6b7280' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280', fontSize: 9 },
  value: { fontWeight: 'bold' },
  invoiceInfo: { marginBottom: 15 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    fontSize: 9,
  },
  colName: { flex: 3 },
  colBatch: { flex: 2 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  summarySection: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 },
  summaryLabel: { width: 120, textAlign: 'right', marginRight: 10, color: '#6b7280' },
  summaryValue: { width: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#d1d5db' },
  totalLabel: { width: 120, textAlign: 'right', marginRight: 10, fontWeight: 'bold', fontSize: 12 },
  totalValue: { width: 80, textAlign: 'right', fontWeight: 'bold', fontSize: 12 },
  footer: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', fontSize: 8, color: '#9ca3af', textAlign: 'center' },
  paymentBadge: { marginTop: 10, fontSize: 9 },
});

// ── PDF Document Components ──

function DetailedInvoice({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>{data.pharmacyName}</Text>
          <Text style={styles.pharmacyAddress}>{data.pharmacyAddress}</Text>
        </View>

        <View style={styles.invoiceInfo}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Invoice Number</Text>
              <Text style={styles.value}>{data.invoiceNumber}</Text>
            </View>
            <View>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{data.date}</Text>
            </View>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{data.patientName}</Text>
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Medicine</Text>
          <Text style={styles.colBatch}>Batch</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colBatch}>{item.batchNumber || '—'}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>₹{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colTotal}>₹{item.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>-₹{data.discount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{data.gst.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{data.finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.paymentBadge}>Payment Method: {data.paymentMethod}</Text>

        <Text style={styles.footer}>Thank you for your purchase!</Text>
      </Page>
    </Document>
  );
}

function CompactInvoice({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>{data.pharmacyName}</Text>
          <Text style={styles.pharmacyAddress}>{data.pharmacyAddress}</Text>
        </View>

        <View style={styles.invoiceInfo}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Invoice</Text>
              <Text style={styles.value}>{data.invoiceNumber}</Text>
            </View>
            <View>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{data.date}</Text>
            </View>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{data.patientName}</Text>
          </View>
        </View>

        {/* Compact: just name, qty, total per item */}
        <View style={styles.tableHeader}>
          <Text style={{ flex: 4 }}>Medicine</Text>
          <Text style={{ flex: 1, textAlign: 'right' }}>Qty</Text>
          <Text style={{ flex: 2, textAlign: 'right' }}>Amount</Text>
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={{ flex: 4 }}>{item.name}</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>{item.quantity}</Text>
            <Text style={{ flex: 2, textAlign: 'right' }}>₹{item.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{data.subtotal.toFixed(2)}</Text>
          </View>
          {data.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-₹{data.discount.toFixed(2)}</Text>
            </View>
          )}
          {data.gst > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST</Text>
              <Text style={styles.summaryValue}>₹{data.gst.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{data.finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.paymentBadge}>Paid via {data.paymentMethod}</Text>
        <Text style={styles.footer}>Thank you!</Text>
      </Page>
    </Document>
  );
}

// ── Helper: normalize API response to InvoiceData ──

function normalizeInvoiceData(raw: any): InvoiceData {
  const items: InvoiceItem[] = (raw.items || []).map((item: any) => ({
    name: item.medicineName || item.name || '',
    batchNumber: item.batchNumber || '',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice || item.pricePerUnit) || 0,
    total: Number(item.total || item.lineTotal) || (Number(item.quantity) * Number(item.unitPrice || item.pricePerUnit)) || 0,
  }));

  return {
    pharmacyName: raw.pharmacyName || raw.pharmacy?.name || 'Pharmacy',
    pharmacyAddress: raw.pharmacyAddress || raw.pharmacy?.address || '',
    invoiceNumber: raw.invoiceNumber || raw.id || '',
    date: raw.date || (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
    patientName: raw.patientName || raw.patient?.name || 'Walk-in Customer',
    items,
    subtotal: Number(raw.subtotal) || 0,
    discount: Number(raw.discount || raw.discountAmount) || 0,
    gst: Number(raw.gst || raw.taxAmount) || 0,
    finalAmount: Number(raw.finalAmount || raw.totalAmount) || 0,
    paymentMethod: raw.paymentMethod || 'CASH',
  };
}

// ── Print helper ──

async function printInvoicePdf(data: InvoiceData, format: InvoiceFormat) {
  const doc = format === 'detailed'
    ? <DetailedInvoice data={data} />
    : <CompactInvoice data={data} />;

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

// ── Exported Components ──

/**
 * InvoicePDFViewer — renders invoice actions (print + send bill) for a given sale.
 * Fetches invoice data via useSaleInvoice hook.
 */
export function InvoicePDFViewer({ saleId }: { saleId: string }) {
  const { data: rawInvoice, isLoading, error } = useSaleInvoice(saleId);
  const sendBill = useSendBill();
  const [format, setFormat] = useState<InvoiceFormat>('detailed');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const invoiceData = rawInvoice ? normalizeInvoiceData(rawInvoice) : null;

  const handlePrint = useCallback(async () => {
    if (!invoiceData) return;
    await printInvoicePdf(invoiceData, format);
  }, [invoiceData, format]);

  const handleSendBill = useCallback(() => {
    setSendStatus('sending');
    sendBill.mutate(saleId, {
      onSuccess: () => setSendStatus('sent'),
      onError: () => setSendStatus('error'),
    });
  }, [saleId, sendBill]);

  if (isLoading) {
    return <p className="text-gray-500 text-sm">Loading invoice...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-sm">Failed to load invoice.</p>;
  }

  if (!invoiceData) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Invoice</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Format:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as InvoiceFormat)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="detailed">Detailed</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>

      {/* Invoice preview summary */}
      <div className="text-sm space-y-1 text-gray-600">
        <p>Invoice: {invoiceData.invoiceNumber}</p>
        <p>Patient: {invoiceData.patientName}</p>
        <p>Items: {invoiceData.items.length}</p>
        <p className="font-medium text-gray-900">Total: ₹{invoiceData.finalAmount.toFixed(2)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          Print Invoice
        </button>
        <button
          onClick={handleSendBill}
          disabled={sendStatus === 'sending' || sendStatus === 'sent'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm"
        >
          {sendStatus === 'sending'
            ? 'Sending...'
            : sendStatus === 'sent'
              ? 'Bill Sent ✓'
              : 'Send Bill to Patient'}
        </button>
      </div>

      {sendStatus === 'sent' && (
        <p className="text-green-600 text-sm">Bill sent to patient successfully.</p>
      )}
      {sendStatus === 'error' && (
        <p className="text-red-600 text-sm">Failed to send bill. Please try again.</p>
      )}
    </div>
  );
}

/**
 * Standalone print function for use outside the InvoicePDFViewer component.
 * Accepts raw invoice data and prints it.
 */
export { printInvoicePdf, normalizeInvoiceData };
export type { InvoiceData as InvoicePDFData };
