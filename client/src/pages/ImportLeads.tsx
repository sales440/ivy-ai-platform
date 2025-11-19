/**
 * Import Leads Page - CSV import interface for bulk lead upload
 * Supports automatic sector detection and field mapping
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImportLeads() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const [csvData, setCsvData] = useState("");
  const [delimiter, setDelimiter] = useState<"," | ";" | "\t">(",");
  const [autoDetectSector, setAutoDetectSector] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const previewMutation = trpc.import.previewCSV.useMutation();
  const importMutation = trpc.import.importLeads.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      toast.success(`Archivo ${file.name} cargado exitosamente`);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvData.trim()) {
      toast.error("Por favor ingresa o carga datos CSV");
      return;
    }

    try {
      const result = await previewMutation.mutateAsync({
        csvData,
        delimiter,
      });

      if (result.success) {
        setPreviewData(result);
        toast.success(`Preview generado: ${result.totalRows} filas detectadas`);
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      toast.error("Error al procesar CSV");
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (!companyId) {
      toast.error("Por favor selecciona una empresa");
      return;
    }

    if (!previewData || !previewData.success) {
      toast.error("Por favor genera un preview primero");
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      // Parse all CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const leads = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Map to lead object (simplified version)
        const lead = mapCSVRowToLead(row);
        leads.push(lead);
      }

      const result = await importMutation.mutateAsync({
        companyId,
        leads,
        autoDetectSector,
        skipDuplicates,
      });

      setImportResults(result);
      
      if (result.imported > 0) {
        toast.success(`✅ ${result.imported} leads importados exitosamente`);
      }
      if (result.skipped > 0) {
        toast.info(`⏭️ ${result.skipped} leads omitidos (duplicados)`);
      }
      if (result.errors.length > 0) {
        toast.error(`❌ ${result.errors.length} errores durante importación`);
      }
    } catch (error: any) {
      toast.error("Error al importar leads");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name,email,phone,company,title,industry,location,source,status,priority,notes,budget,installation_size
Juan Pérez,juan@example.com,5551234567,Colegio Montessori,Director,educativo,Oaxaca,referral,new,high,Interesado en mantenimiento preventivo,45000,5000
María García,maria@hotel.com,5559876543,Hotel Boutique Casa Oaxaca,Gerente General,hotelero,Oaxaca,organic,contacted,medium,Solicita cotización servicio 24/7,80000,3000
Carlos López,carlos@residencial.com,5555555555,Residencial Los Arcos,Administrador,residencial,Oaxaca,cold,new,low,Consulta por mantenimiento áreas comunes,50000,8000`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_importacion_leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template descargado");
  };

  // Helper function to map CSV row (same logic as backend)
  const mapCSVRowToLead = (row: Record<string, string>) => {
    const findField = (possibleNames: string[]): string | undefined => {
      for (const name of possibleNames) {
        const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
        if (key && row[key]) return row[key];
      }
      return undefined;
    };

    return {
      name: findField(['name', 'nombre', 'contact']) || 'Sin nombre',
      email: findField(['email', 'correo']),
      phone: findField(['phone', 'telefono', 'teléfono']),
      company: findField(['company', 'empresa']),
      title: findField(['title', 'cargo', 'position']),
      industry: findField(['industry', 'industria', 'sector']),
      location: findField(['location', 'ubicacion', 'ubicación']),
      source: findField(['source', 'fuente']),
      status: findField(['status', 'estado']) as any || 'new',
      priority: findField(['priority', 'prioridad']) as any,
      notes: findField(['notes', 'notas']),
      budget: parseFloat(findField(['budget', 'presupuesto']) || '0') || undefined,
      installationSize: parseFloat(findField(['installation_size', 'tamaño', 'm2']) || '0') || undefined,
    };
  };

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Selecciona una empresa</h2>
          <p className="text-muted-foreground">
            Por favor selecciona una empresa desde el selector en el header para importar leads.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Importar Leads desde CSV</h1>
            <p className="text-muted-foreground">
              Importa leads masivamente desde archivo CSV con detección automática de sectores
            </p>
          </div>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Template
          </Button>
        </div>

        {/* Instructions */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato CSV esperado:</strong> name, email, phone, company, title, industry, location, source, status, priority, notes, budget, installation_size.
            El sistema detectará automáticamente el sector (educativo/hotelero/residencial) basado en el nombre de la empresa y la industria.
          </AlertDescription>
        </Alert>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar Archivo CSV
            </CardTitle>
            <CardDescription>
              Sube un archivo CSV o pega los datos directamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Subir Archivo</Label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="csv-data">O pega los datos CSV aquí</Label>
              <Textarea
                id="csv-data"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="name,email,phone,company,title,industry,location&#10;Juan Pérez,juan@example.com,5551234567,Colegio Montessori,Director,educativo,Oaxaca"
                rows={8}
                className="font-mono text-sm mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delimiter">Delimitador</Label>
                <Select value={delimiter} onValueChange={(v: any) => setDelimiter(v)}>
                  <SelectTrigger id="delimiter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Coma (,)</SelectItem>
                    <SelectItem value=";">Punto y coma (;)</SelectItem>
                    <SelectItem value="\t">Tabulador (\t)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={autoDetectSector}
                    onCheckedChange={(checked) => setAutoDetectSector(checked as boolean)}
                  />
                  <span className="text-sm">Auto-detectar sector</span>
                </label>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <span className="text-sm">Omitir duplicados</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePreview} disabled={!csvData.trim() || previewMutation.isPending}>
                {previewMutation.isPending ? "Procesando..." : "Generar Preview"}
              </Button>
              {previewData && (
                <Button onClick={handleImport} disabled={importing || !previewData.success}>
                  {importing ? "Importando..." : `Importar ${previewData.totalRows} Leads`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {previewData && previewData.success && (
          <Card>
            <CardHeader>
              <CardTitle>Preview de Importación</CardTitle>
              <CardDescription>
                Mostrando las primeras 10 filas de {previewData.totalRows} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nombre</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Empresa</th>
                      <th className="text-left p-2">Sector</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.previewRows.map((row: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.email || '-'}</td>
                        <td className="p-2">{row.company || '-'}</td>
                        <td className="p-2">
                          <Badge variant="outline">{row.industry || 'otro'}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {importResults && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resultados de Importación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{importResults.imported}</div>
                  <div className="text-sm text-muted-foreground">Importados</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{importResults.skipped}</div>
                  <div className="text-sm text-muted-foreground">Omitidos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Errores:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {importResults.errors.slice(0, 5).map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResults.errors.length > 5 && (
                      <li>... y {importResults.errors.length - 5} errores más</li>
                    )}
                  </ul>
                </div>
              )}

              <Button onClick={() => window.location.href = '/leads'} className="w-full">
                Ver Leads Importados
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
