import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "@/lib/pdf/pdf-styles";
import "@/lib/pdf/register-fonts";
import { formatCurrency, formatDate, toVariabilnySymbol } from "@/lib/formatting";
import type { Invoice, Settings } from "@/lib/types";
import logoDark from "@/assets/logo-dark.png";

interface InvoicePdfProps {
  invoice: Invoice;
  settings: Settings;
}

export function InvoicePdf({ invoice, settings }: InvoicePdfProps) {
  const isVyuctovacia = invoice.type === "vyuctovacia";
  const titleText = isVyuctovacia
    ? `VYÚČTOVACIA FAKTÚRA č. ${invoice.invoice_number}`
    : `FAKTÚRA č. ${invoice.invoice_number}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoDark} style={styles.logo} />
          <Text style={styles.title}>{titleText}</Text>
        </View>

        {/* Payment box */}
        <View style={styles.paymentBox}>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Suma k úhrade</Text>
            <Text style={styles.paymentValueLarge}>
              {formatCurrency(invoice.amount_due)}
            </Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Splatnosť</Text>
            <Text style={styles.paymentValue}>{formatDate(invoice.date_due)}</Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Číslo účtu (IBAN)</Text>
            <Text style={styles.paymentValue}>{settings.supplier_iban}</Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Banka</Text>
            <Text style={styles.paymentValue}>{settings.supplier_bank}</Text>
          </View>
          <View style={styles.paymentBoxLastRow}>
            <Text style={styles.paymentLabel}>Variabilný symbol</Text>
            <Text style={styles.paymentValue}>
              {toVariabilnySymbol(invoice.invoice_number)}
            </Text>
          </View>
        </View>

        {/* Two columns: Dodávateľ | Odberateľ */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Dodávateľ</Text>
            <Text style={styles.companyName}>{settings.supplier_name}</Text>
            {settings.supplier_street ? (
              <Text style={styles.companyDetail}>{settings.supplier_street}</Text>
            ) : null}
            {settings.supplier_city ? (
              <Text style={styles.companyDetail}>{settings.supplier_city}</Text>
            ) : null}
            {settings.supplier_ico ? (
              <Text style={styles.companyDetail}>IČO: {settings.supplier_ico}</Text>
            ) : null}
            {settings.supplier_dic ? (
              <Text style={styles.companyDetail}>DIČ: {settings.supplier_dic}</Text>
            ) : null}
            {settings.supplier_ic_dph ? (
              <Text style={styles.companyDetail}>IČ DPH: {settings.supplier_ic_dph}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Odberateľ</Text>
            <Text style={styles.companyName}>{invoice.client_name}</Text>
            {invoice.client_street ? (
              <Text style={styles.companyDetail}>{invoice.client_street}</Text>
            ) : null}
            {invoice.client_city ? (
              <Text style={styles.companyDetail}>{invoice.client_city}</Text>
            ) : null}
            {invoice.client_ico ? (
              <Text style={styles.companyDetail}>IČO: {invoice.client_ico}</Text>
            ) : null}
            {invoice.client_dic ? (
              <Text style={styles.companyDetail}>DIČ: {invoice.client_dic}</Text>
            ) : null}
            {invoice.client_ic_dph ? (
              <Text style={styles.companyDetail}>IČ DPH: {invoice.client_ic_dph}</Text>
            ) : null}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.separator} />
        <View style={{ marginBottom: 16 }}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum vystavenia</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.date_of_issue)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum splatnosti</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.date_due)}</Text>
          </View>
          {invoice.date_of_supply ? (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Dátum dodania služby</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.date_of_supply)}</Text>
            </View>
          ) : null}
        </View>

        {/* Service line */}
        <View style={styles.separator} />
        <View style={styles.serviceTable}>
          <View style={styles.serviceTableHeader}>
            <Text style={styles.serviceColDescription}>Popis / MJ</Text>
            <Text style={styles.serviceColRight}>Množstvo</Text>
            <Text style={styles.serviceColRight}>J.cena</Text>
            <Text style={styles.serviceColRight}>Cena bez DPH</Text>
          </View>
          <View style={styles.serviceTableRow}>
            <View style={{ flex: 3 }}>
              <Text style={styles.serviceColDescriptionValue}>
                {invoice.service_description || "Právne služby"}
              </Text>
              <Text style={[styles.companyDetail, { marginTop: 1 }]}>
                {invoice.unit}
              </Text>
            </View>
            <Text style={styles.serviceColRightValue}>{invoice.quantity}</Text>
            <Text style={styles.serviceColRightValue}>
              {formatCurrency(invoice.unit_price)}
            </Text>
            <Text style={styles.serviceColRightValue}>
              {formatCurrency(invoice.price_without_vat)}
            </Text>
          </View>
        </View>

        {/* Invoice text */}
        {invoice.invoice_text ? (
          <Text style={styles.invoiceText}>{invoice.invoice_text}</Text>
        ) : null}

        {/* Totals */}
        <View style={styles.separator} />
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Odmena</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.price_without_vat)}
            </Text>
          </View>
          {settings.is_vat_payer ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>DPH ({invoice.vat_rate} %)</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.vat_amount)}
              </Text>
            </View>
          ) : (
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { fontStyle: "italic" }]}>
                Nie som platca DPH
              </Text>
            </View>
          )}
          {isVyuctovacia && invoice.advance_invoice_number ? (
            <View style={styles.totalsRow}>
              <Text style={styles.advanceDeductionLabel}>
                Odpočet zálohy ({invoice.advance_invoice_number})
              </Text>
              <Text style={styles.advanceDeductionValue}>
                −{formatCurrency(invoice.advance_deduction)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.separator, { marginTop: 6, marginBottom: 6 }]} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalsFinalLabel}>
              {isVyuctovacia ? "Na doplatok" : "Celkom k úhrade"}
            </Text>
            <Text style={styles.totalsFinalValue}>
              {formatCurrency(invoice.amount_due)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Pečiatka a podpis odberateľa</Text>
            <View style={styles.footerSignatureLine} />
            <Text style={styles.footerSignatureCaption}>podpis</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={[styles.footerLabel, { textAlign: "right" }]}>
              Pečiatka a podpis dodávateľa
            </Text>
            <View
              style={[
                styles.footerSignatureLine,
                { alignSelf: "flex-end" },
              ]}
            />
            <Text
              style={[styles.footerSignatureCaption, { textAlign: "right" }]}
            >
              podpis
            </Text>
          </View>
        </View>
        <Text style={styles.footerIssuedBy}>
          Faktúru vystavil: {invoice.issued_by}
        </Text>
      </Page>
    </Document>
  );
}
