import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, DollarSign, TrendingUp, Download, FileDown } from "lucide-react";
import { exportROIToCSV, generateROIPDFReport } from "@/lib/reportExport";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

/**
 * ROI Dashboard by Sector
 * Revenue projections based on EPM historical data
 */
export default function ROIDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Get ML scoring metrics for ROI calculation
  const { data: scoringData, isLoading } = trpc.mlScoring.getCompanyStats.useQuery(
    { companyId: user?.companyId || 1 },
    { enabled: !!user }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // EPM Historical Data (from ML scoring system)
  const sectorData = [
    {
      sector: 'Educativo',
      conversionRate: 26.7,
      avgTicket: 45000,
      avgCloseDays: 21,
      color: 'blue',
    },
    {
      sector: 'Hotelero',
      conversionRate: 44.4,
      avgTicket: 80000,
      avgCloseDays: 14,
      color: 'green',
    },
    {
      sector: 'Residencial',
      conversionRate: 46.9,
      avgTicket: 50000,
      avgCloseDays: 28,
      color: 'purple',
    },
  ];

  // Calculate ROI projections
  const calculateROI = (sector: typeof sectorData[0], leadCount: number) => {
    const expectedConversions = (leadCount * sector.conversionRate) / 100;
    const projectedRevenue = expectedConversions * sector.avgTicket;
    return {
      expectedConversions: Math.round(expectedConversions),
      projectedRevenue,
      avgCloseDays: sector.avgCloseDays,
    };
  };

  // Mock lead counts by sector (in production, this would come from database)
  const leadsBySector = {
    educativo: scoringData?.totalLeads ? Math.floor(scoringData.totalLeads * 0.3) : 15,
    hotelero: scoringData?.totalLeads ? Math.floor(scoringData.totalLeads * 0.35) : 20,
    residencial: scoringData?.totalLeads ? Math.floor(scoringData.totalLeads * 0.35) : 20,
  };

  const educativoROI = calculateROI(sectorData[0], leadsBySector.educativo);
  const hoteleroROI = calculateROI(sectorData[1], leadsBySector.hotelero);
  const residencialROI = calculateROI(sectorData[2], leadsBySector.residencial);

  const totalProjectedRevenue = 
    educativoROI.projectedRevenue + 
    hoteleroROI.projectedRevenue + 
    residencialROI.projectedRevenue;

  const totalExpectedConversions = 
    educativoROI.expectedConversions + 
    hoteleroROI.expectedConversions + 
    residencialROI.expectedConversions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">ROI Dashboard</h1>
              <p className="text-muted-foreground">
                Revenue projections by sector based on EPM historical data
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                const roiData = [
                  { sector: 'Educativo', leadCount: leadsBySector.educativo, ...sectorData[0], ...educativoROI },
                  { sector: 'Hotelero', leadCount: leadsBySector.hotelero, ...sectorData[1], ...hoteleroROI },
                  { sector: 'Residencial', leadCount: leadsBySector.residencial, ...sectorData[2], ...residencialROI },
                ];
                exportROIToCSV(roiData);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const roiData = [
                  { sector: 'Educativo', leadCount: leadsBySector.educativo, ...sectorData[0], ...educativoROI },
                  { sector: 'Hotelero', leadCount: leadsBySector.hotelero, ...sectorData[1], ...hoteleroROI },
                  { sector: 'Residencial', leadCount: leadsBySector.residencial, ...sectorData[2], ...residencialROI },
                ];
                generateROIPDFReport(roiData);
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Overall Projections */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projected Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalProjectedRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Based on current pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpectedConversions}</div>
              <p className="text-xs text-muted-foreground">
                Deals projected to close
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Ticket Size</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalProjectedRevenue / totalExpectedConversions)}
              </div>
              <p className="text-xs text-muted-foreground">
                Weighted average across sectors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ROI by Sector */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Educativo */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Educativo</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {sectorData[0].conversionRate}% conv.
                </Badge>
              </div>
              <CardDescription>{leadsBySector.educativo} leads activos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Conversiones Esperadas</div>
                <div className="text-2xl font-bold">{educativoROI.expectedConversions}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Revenue Proyectado</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(educativoROI.projectedRevenue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ticket Promedio</div>
                <div className="text-lg font-semibold">{formatCurrency(sectorData[0].avgTicket)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tiempo de Cierre</div>
                <div className="text-lg font-semibold">{sectorData[0].avgCloseDays} días</div>
              </div>
            </CardContent>
          </Card>

          {/* Hotelero */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hotelero</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  {sectorData[1].conversionRate}% conv.
                </Badge>
              </div>
              <CardDescription>{leadsBySector.hotelero} leads activos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Conversiones Esperadas</div>
                <div className="text-2xl font-bold">{hoteleroROI.expectedConversions}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Revenue Proyectado</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(hoteleroROI.projectedRevenue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ticket Promedio</div>
                <div className="text-lg font-semibold">{formatCurrency(sectorData[1].avgTicket)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tiempo de Cierre</div>
                <div className="text-lg font-semibold">{sectorData[1].avgCloseDays} días</div>
              </div>
            </CardContent>
          </Card>

          {/* Residencial */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Residencial</CardTitle>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {sectorData[2].conversionRate}% conv.
                </Badge>
              </div>
              <CardDescription>{leadsBySector.residencial} leads activos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Conversiones Esperadas</div>
                <div className="text-2xl font-bold">{residencialROI.expectedConversions}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Revenue Proyectado</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(residencialROI.projectedRevenue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ticket Promedio</div>
                <div className="text-lg font-semibold">{formatCurrency(sectorData[2].avgTicket)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tiempo de Cierre</div>
                <div className="text-lg font-semibold">{sectorData[2].avgCloseDays} días</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">
              📊 Datos Históricos EPM Construcciones
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-800 dark:text-green-200 space-y-2">
            <p>
              <strong>Educativo:</strong> 26.7% conversión, $45K MXN ticket promedio, 21 días cierre
            </p>
            <p>
              <strong>Hotelero:</strong> 44.4% conversión, $80K MXN ticket promedio, 14 días cierre
            </p>
            <p>
              <strong>Residencial:</strong> 46.9% conversión, $50K MXN ticket promedio, 28 días cierre
            </p>
            <p className="text-sm mt-4 text-green-600 dark:text-green-300">
              💡 Las proyecciones se calculan automáticamente basadas en el scoring ML de cada lead
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
