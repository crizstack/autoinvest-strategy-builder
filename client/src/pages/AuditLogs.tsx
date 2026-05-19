import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  LogOut,
  Search,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AuditLogType =
  | "login_success"
  | "login_failed"
  | "login_2fa"
  | "suspicious_activity"
  | "password_changed"
  | "2fa_enabled"
  | "2fa_disabled"
  | "session_revoked"
  | "strategy_created"
  | "strategy_deleted"
  | "trade_executed"
  | "settings_changed";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Fetch audit logs from server
  const { data: logs = [], isLoading } = trpc.system.getAuditLogs.useQuery({
    limit: 100,
    offset: 0,
  });

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.includes(searchTerm);

      const matchesEventType =
        eventTypeFilter === "all" || log.action === eventTypeFilter;

      const matchesSeverity =
        severityFilter === "all" || log.severity === severityFilter;

      return matchesSearch && matchesEventType && matchesSeverity;
    });
  }, [logs, searchTerm, eventTypeFilter, severityFilter]);

  // Get icon for event type
  const getEventIcon = (action: string) => {
    switch (action) {
      case "login_success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "login_failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "login_2fa":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "suspicious_activity":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "session_revoked":
        return <LogOut className="w-4 h-4 text-red-500" />;
      case "password_changed":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "2fa_enabled":
        return <Shield className="w-4 h-4 text-green-500" />;
      case "2fa_disabled":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get event type label
  const getEventLabel = (action: string) => {
    const labels: Record<string, string> = {
      login_success: "Login bem-sucedido",
      login_failed: "Login falhado",
      login_2fa: "2FA verificado",
      suspicious_activity: "Atividade suspeita",
      password_changed: "Senha alterada",
      "2fa_enabled": "2FA ativado",
      "2fa_disabled": "2FA desativado",
      session_revoked: "Sessão revogada",
      strategy_created: "Estratégia criada",
      strategy_deleted: "Estratégia deletada",
      trade_executed: "Trade executado",
      settings_changed: "Configurações alteradas",
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <Clock className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as ações e eventos de segurança da sua conta
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ação, descrição ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Event Type Filter */}
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <option value="all">Todos os eventos</option>
            <option value="login_success">Login bem-sucedido</option>
            <option value="login_failed">Login falhado</option>
            <option value="login_2fa">2FA verificado</option>
            <option value="suspicious_activity">Atividade suspeita</option>
            <option value="password_changed">Senha alterada</option>
            <option value="session_revoked">Sessão revogada</option>
          </Select>

          {/* Severity Filter */}
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <option value="all">Todas as severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </Select>

          {/* Date Range */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todos os períodos</option>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de eventos</p>
              <p className="text-2xl font-bold">{filteredLogs.length}</p>
            </div>
            <Clock className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Eventos críticos</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l) => l.severity === "critical").length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Logins</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l) => l.action.includes("login")).length}
              </p>
            </div>
            <User className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Atividades suspeitas</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l) => l.action === "suspicious_activity").length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>IP / Localização</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Clock className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                    <p className="text-muted-foreground">Nenhum log encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, idx) => (
                <TableRow key={idx} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventIcon(log.action)}
                      <span className="font-medium">{getEventLabel(log.action)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.description || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                        log.severity
                      )}`}
                    >
                      {log.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
