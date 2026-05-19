import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BacktestReportData {
  strategyName: string;
  asset: string;
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    profitFactor: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    recoveryFactor: number;
  };
  trades: Array<{
    date: Date;
    symbol: string;
    type: "BUY" | "SELL";
    price: number;
    quantity: number;
    profit?: number;
  }>;
}

export class PDFExportService {
  static generateBacktestReport(data: BacktestReportData): PDFDocument {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("Relatório de Backtest", {
      align: "center",
    });

    doc.fontSize(12).font("Helvetica").text(`Estratégia: ${data.strategyName}`, {
      align: "center",
    });

    doc.fontSize(11).text(`Ativo: ${data.asset} | Período: ${data.period}`, {
      align: "center",
    });

    doc.fontSize(10).text(
      `${format(data.startDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(
        data.endDate,
        "dd/MM/yyyy",
        { locale: ptBR }
      )}`,
      { align: "center" }
    );

    doc.fontSize(9).text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      { align: "center" }
    );

    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).stroke();
    doc.moveDown(1);

    // Metrics Section
    doc.fontSize(14).font("Helvetica-Bold").text("Métricas Principais");
    doc.moveDown(0.5);

    const metricsData = [
      ["Retorno Total", `${(data.metrics.totalReturn * 100).toFixed(2)}%`],
      ["Sharpe Ratio", `${data.metrics.sharpeRatio.toFixed(2)}`],
      ["Profit Factor", `${data.metrics.profitFactor.toFixed(2)}`],
      ["Max Drawdown", `${(data.metrics.maxDrawdown * 100).toFixed(2)}%`],
      ["Taxa de Acerto", `${(data.metrics.winRate * 100).toFixed(2)}%`],
      ["Recovery Factor", `${data.metrics.recoveryFactor.toFixed(2)}`],
    ];

    doc.fontSize(10).font("Helvetica");
    metricsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });

    doc.moveDown(1);

    // Summary Section
    doc.fontSize(14).font("Helvetica-Bold").text("Resumo de Operações");
    doc.moveDown(0.5);

    const summaryData = [
      ["Total de Trades", `${data.metrics.totalTrades}`],
      ["Trades Vencedores", `${data.metrics.winningTrades}`],
      ["Trades Perdedores", `${data.metrics.losingTrades}`],
      ["Média de Ganho", `${(data.metrics.averageWin * 100).toFixed(2)}%`],
      ["Média de Perda", `${(data.metrics.averageLoss * 100).toFixed(2)}%`],
    ];

    doc.fontSize(10).font("Helvetica");
    summaryData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });

    doc.moveDown(1);

    // Trades Table (if not too many)
    if (data.trades.length > 0 && data.trades.length <= 20) {
      doc.fontSize(14).font("Helvetica-Bold").text("Últimas Operações");
      doc.moveDown(0.5);

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text(
        "Data".padEnd(15) +
          "Símbolo".padEnd(12) +
          "Tipo".padEnd(8) +
          "Preço".padEnd(12) +
          "Qtd".padEnd(8) +
          "Lucro"
      );

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(8).font("Helvetica");
      data.trades.slice(0, 20).forEach((trade) => {
        const dateStr = format(trade.date, "dd/MM/yyyy", { locale: ptBR });
        const profitStr = trade.profit ? `${(trade.profit * 100).toFixed(2)}%` : "-";

        doc.text(
          dateStr.padEnd(15) +
            trade.symbol.padEnd(12) +
            trade.type.padEnd(8) +
            `${trade.price.toFixed(2)}`.padEnd(12) +
            `${trade.quantity}`.padEnd(8) +
            profitStr
        );
      });
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(8).font("Helvetica");
    doc.text(
      "Este relatório foi gerado automaticamente pelo sistema AutoInvest Strategy Builder",
      { align: "center" }
    );

    doc.text(
      "Aviso: Este é um relatório de backtest histórico. Resultados passados não garantem resultados futuros.",
      { align: "center" }
    );

    return doc;
  }

  static async exportToBuffer(data: BacktestReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.generateBacktestReport(data);
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err) => {
        reject(err);
      });

      doc.end();
    });
  }

  static getFileName(strategyName: string): string {
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    return `backtest_${strategyName.replace(/\s+/g, "_")}_${timestamp}.pdf`;
  }
}
