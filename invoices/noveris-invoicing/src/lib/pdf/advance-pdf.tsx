import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "@/lib/pdf/pdf-styles";
import "@/lib/pdf/register-fonts";
import { formatCurrency, formatDate, toVariabilnySymbol } from "@/lib/formatting";
import type { AdvanceInvoice, Settings } from "@/lib/types";
import logoDark from "@/assets/logo-dark.png";

interface AdvancePdfProps {
  advance: AdvanceInvoice;
  settings: Settings;
}

export function AdvancePdf({ advance, settings }: AdvancePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoDark} style={styles.logo} />
          <Text style={styles.title}>
            ZÁLOHOVÁ FAKTÚRA č. {advance.invoice_number}
          </Text>
        </View>

        {/* Payment box */}
        <View style={styles.paymentBox}>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Suma k úhrade</Text>
            <Text style={styles.paymentValueLarge}>
              {formatCurrency(advance.advance_amount)}
            </Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Splatnosť</Text>
            <Text style={styles.paymentValue}>{formatDate(advance.date_due)}</Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Číslo účtu (IBAN)</Text>
            <Text style={styles.paymentValue}>{settings.supplier_iban}</Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Banka</Text>
            <Text style={styles.paymentValue}>{settings.supplier_bank}</Text>
          </View>
          <View style={styles.paymentBoxRow}>
            <Text style={styles.paymentLabel}>Variabilný symbol</Text>
            <Text style={styles.paymentValue}>
              {toVariabilnySymbol(advance.invoice_number)}
            </Text>
          </View>
          <View style={styles.paymentBoxLastRow}>
            <Text style={styles.paymentLabel}>Forma úhrady</Text>
            <Text style={styles.paymentValue}>{advance.payment_method}</Text>
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
              <Text style={styles.companyDetail}>
                IČ DPH: {settings.supplier_ic_dph}
              </Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Odberateľ</Text>
            <Text style={styles.companyName}>{advance.client_name}</Text>
            {advance.client_street ? (
              <Text style={styles.companyDetail}>{advance.client_street}</Text>
            ) : null}
            {advance.client_city ? (
              <Text style={styles.companyDetail}>{advance.client_city}</Text>
            ) : null}
            {advance.client_ico ? (
              <Text style={styles.companyDetail}>IČO: {advance.client_ico}</Text>
            ) : null}
            {advance.client_dic ? (
              <Text style={styles.companyDetail}>DIČ: {advance.client_dic}</Text>
            ) : null}
            {advance.client_ic_dph ? (
              <Text style={styles.companyDetail}>
                IČ DPH: {advance.client_ic_dph}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.separator} />
        <View style={{ marginBottom: 16 }}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum vystavenia</Text>
            <Text style={styles.dateValue}>{formatDate(advance.date_of_issue)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum splatnosti</Text>
            <Text style={styles.dateValue}>{formatDate(advance.date_due)}</Text>
          </View>
        </View>

        {/* Description + total */}
        <View style={styles.separator} />
        {advance.description ? (
          <Text style={[styles.invoiceText, { marginBottom: 16 }]}>
            {advance.description}
          </Text>
        ) : null}

        {/* Total */}
        <View style={styles.totalsSection}>
          <View style={[styles.separator, { marginTop: 0, marginBottom: 6 }]} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalsFinalLabel}>Záloha k úhrade</Text>
            <Text style={styles.totalsFinalValue}>
              {formatCurrency(advance.advance_amount)}
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
              style={[styles.footerSignatureLine, { alignSelf: "flex-end" }]}
            />
            <Text
              style={[styles.footerSignatureCaption, { textAlign: "right" }]}
            >
              podpis
            </Text>
          </View>
        </View>
        <Text style={styles.footerIssuedBy}>
          Faktúru vystavil: {advance.issued_by}
        </Text>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ZÁLOHOVÁ FAKTÚRA NIE JE DAŇOVÝ DOKLAD!
        </Text>
      </Page>
    </Document>
  );
}
