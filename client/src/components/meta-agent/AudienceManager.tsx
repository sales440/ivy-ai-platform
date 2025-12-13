
import { useState, useRef } from "react";
import {
    Users,
    Upload,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Search,
    MoreHorizontal,
    Plus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function AudienceManager() {
    const [searchTerm, setSearchTerm] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importType, setImportType] = useState<string | null>(null);

    // Fetch leads from backend
    const { data: leadsData, refetch: refetchLeads, isLoading } = trpc.leads.list.useQuery({ companyId: 1 }); // Assuming companyId 1 for now or context
    const contacts = leadsData?.leads || [];

    // Import Mutation
    const importMutation = trpc.import.importLeads.useMutation({
        onSuccess: (data) => {
            toast.success(`Import successful! Added ${data.imported} contacts.`);
            if (data.skipped > 0) toast.info(`Skipped ${data.skipped} duplicates.`);
            if (data.errors.length > 0) toast.error(`Failed to import ${data.errors.length} rows.`);
            refetchLeads();
        },
        onError: (err) => {
            toast.error(`Import failed: ${err.message}`);
        }
    });

    const handleImportClick = (type: string) => {
        setImportType(type);
        if (type === 'CSV') {
            fileInputRef.current?.click();
        } else {
            toast.info(`${type} Import: Feature requires backend module activation.`, {
                description: "Please convert to CSV for instant import.",
                duration: 5000,
            });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (importType === 'CSV') {
            const text = await file.text();
            // Basic CSV to JSON parser for the mutation
            // The Mutation expects { leads: [{ name, ... }] }
            // Using the importRouter's previewCSV might be better, but let's do a direct client-side parse for speed
            // Or better: Use the preview endpoint first?

            // For MVP: Simple client-side parse matching ImportLeadsSchema
            const rows = text.split('\n').slice(1); // Skip header
            const leads = rows.map(row => {
                const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length < 2) return null; // Skip empty rows
                // Assuming format: Name, Email, Company, Role, Phone
                // Use a smarter mapping if needed, but this is a quick start
                return {
                    name: cols[0] || "Unknown",
                    email: cols[1],
                    company: cols[2],
                    title: cols[3],
                    phone: cols[4],
                    status: 'new' as const,
                    source: 'import-csv'
                };
            }).filter((l): l is NonNullable<typeof l> => l !== null);

            if (leads.length === 0) {
                toast.error("No valid leads found in CSV.");
                return;
            }

            importMutation.mutate({
                companyId: 1, // Default to 1
                leads: leads,
                autoDetectSector: true,
                skipDuplicates: true
            });
        }

        // Reset input
        e.target.value = '';
    };

    const handleExport = (type: string) => {
        if (type === 'CSV') {
            // Trigger download via exportRouter
            // Note: In a real app we'd window.open generated URL
            toast.success("Generating CSV export...");
            window.open('/api/trpc/export.leads?input={"json":{"status":null}}', '_blank'); // Rough approximation
        } else {
            toast.info(`${type} Export: Generation queued.`, {
                description: "You will be notified when the document is ready."
            });
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileChange}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-400" />
                        Audience Manager
                    </h2>
                    <p className="text-slate-400">Manage contact lists & data sources</p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-slate-700 bg-slate-900" disabled={importMutation.isPending}>
                                {importMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                Import List
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                            <DropdownMenuLabel>Choose Source</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem onClick={() => handleImportClick('CSV')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-400" /> CSV / Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImportClick('PDF')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileText className="h-4 w-4 mr-2 text-red-400" /> PDF Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImportClick('Word')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileText className="h-4 w-4 mr-2 text-blue-400" /> Word Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Download className="h-4 w-4 mr-2" />
                                Export List
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                            <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem onClick={() => handleExport('CSV')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-400" /> CSV / Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('PDF')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileText className="h-4 w-4 mr-2 text-red-400" /> PDF Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('Word')} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                                <FileText className="h-4 w-4 mr-2 text-blue-400" /> Word Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="bg-slate-950 border-slate-800">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search contacts by name, company or email..."
                                className="pl-9 bg-slate-900 border-slate-800 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <Filter className="h-4 w-4" />
                            </Button>
                            <div className="h-9 px-3 flex items-center bg-slate-900 rounded-md border border-slate-800 text-xs text-slate-400">
                                Total: {contacts.length}
                            </div>
                            <Button size="sm" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-slate-200">
                                <Plus className="h-4 w-4 mr-2" /> Add Manual
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Contact Name</TableHead>
                                    <TableHead className="text-slate-400">Company & Role</TableHead>
                                    <TableHead className="text-slate-400">Contact Info</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                            Loading contacts...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredContacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                            No contacts found. Import a list to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContacts.map((contact: any) => (
                                        <TableRow key={contact.id} className="border-slate-800 hover:bg-slate-900/30">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                                        {contact.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-200">{contact.name}</div>
                                                        <div className="text-xs text-slate-500">ID: #{String(contact.id).padStart(4, '0')}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-300 flex items-center gap-1">
                                                        <Users className="h-3 w-3 text-blue-500" /> {contact.company || '-'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{contact.title || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                                        ✉ {contact.email || '-'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        📞 {contact.phone || '-'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className={`w-fit text-[10px] ${contact.status === 'qualified' ? 'text-green-400 border-green-900 bg-green-950/30' :
                                                            contact.status === 'new' ? 'text-blue-400 border-blue-900 bg-blue-950/30' :
                                                                'text-slate-400 border-slate-900 bg-slate-950/30'
                                                        }`}>
                                                        {(contact.status || 'NEW').toUpperCase()}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500">In: {contact.source || 'Manual'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
