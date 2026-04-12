import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  primary: "#6d5b47",
  secondary: "#735c00",
  text: "#1c1c18",
  muted: "#7f7663",
  line: "#d0c5af",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Manrope",
    fontSize: 9,
    color: colors.text,
    paddingTop: "20mm",
    paddingBottom: "20mm",
    paddingLeft: "20mm",
    paddingRight: "20mm",
    size: "A4",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    width: 100,
  },
  title: {
    fontFamily: "Newsreader",
    fontSize: 18,
    color: colors.secondary,
    textAlign: "right",
  },

  // Payment box
  paymentBox: {
    borderWidth: 0.5,
    borderColor: colors.line,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  paymentBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paymentBoxLastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentLabel: {
    color: colors.muted,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  paymentValue: {
    fontWeight: 700,
    textAlign: "right",
  },
  paymentValueLarge: {
    fontFamily: "Newsreader",
    fontSize: 14,
    fontWeight: 700,
    color: colors.secondary,
    textAlign: "right",
  },

  // Two column layout
  twoCol: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },

  // Section labels
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 4,
  },

  // Company details
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 1,
  },

  // Date rows
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateValue: {
    fontWeight: 500,
  },

  // Separator
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    marginBottom: 12,
    marginTop: 12,
  },

  // Service table
  serviceTable: {
    marginBottom: 12,
  },
  serviceTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    paddingBottom: 4,
    marginBottom: 4,
  },
  serviceTableRow: {
    flexDirection: "row",
    paddingTop: 3,
    paddingBottom: 3,
  },
  serviceColDescription: {
    flex: 3,
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  serviceColDescriptionValue: {
    flex: 3,
  },
  serviceColRight: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  serviceColRightValue: {
    flex: 1,
    textAlign: "right",
  },

  // Totals
  totalsSection: {
    marginTop: 4,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  totalsLabel: {
    color: colors.muted,
    marginRight: 24,
    minWidth: 120,
    textAlign: "right",
  },
  totalsValue: {
    minWidth: 80,
    textAlign: "right",
  },
  totalsFinalLabel: {
    fontFamily: "Newsreader",
    fontSize: 13,
    fontWeight: 700,
    color: colors.secondary,
    marginRight: 24,
    minWidth: 120,
    textAlign: "right",
  },
  totalsFinalValue: {
    fontFamily: "Newsreader",
    fontSize: 13,
    fontWeight: 700,
    color: colors.secondary,
    minWidth: 80,
    textAlign: "right",
  },

  // Footer
  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  footerSignatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    marginBottom: 4,
    width: "80%",
  },
  footerSignatureCaption: {
    fontSize: 8,
    color: colors.muted,
  },
  footerIssuedBy: {
    marginTop: 12,
    fontSize: 8,
    color: colors.muted,
    textAlign: "center",
  },

  // Advance disclaimer
  disclaimer: {
    marginTop: 16,
    textAlign: "center",
    fontWeight: 700,
    color: colors.primary,
    fontSize: 10,
  },

  // Invoice text / note
  invoiceText: {
    marginBottom: 12,
    color: colors.text,
    lineHeight: 1.5,
  },

  // VAT note
  vatNote: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: "italic",
    marginBottom: 3,
  },

  // Advance deduction row
  advanceDeductionLabel: {
    color: colors.muted,
    marginRight: 24,
    minWidth: 120,
    textAlign: "right",
    fontStyle: "italic",
  },
  advanceDeductionValue: {
    minWidth: 80,
    textAlign: "right",
    fontStyle: "italic",
  },
});
