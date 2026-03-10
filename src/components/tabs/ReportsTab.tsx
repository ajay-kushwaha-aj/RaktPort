import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { Inventory, Donation, Redemption, BloodGroup } from '@/types/bloodbank';

interface ReportsTabProps {
    inventory: Inventory;
    donations: Donation[];
    redemptions: Redemption[];
    criticalGroups: BloodGroup[];
}

const Bar = ({ height, label, color = "bg-blue-500", value }: any) => (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
        <div className="relative w-12 bg-gray-100 dark:bg-gray-800 rounded-t-lg h-48 flex items-end overflow-hidden">
            <div
                className={`w-full ${color} transition-all duration-500 group-hover:opacity-80`}
                style={{ height: `${Math.min(height, 100)}%` }}
            />
            <div className="absolute top-2 w-full text-center text-xs font-bold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {value}
            </div>
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
    </div>
);

export const ReportsTab = ({ inventory, donations, redemptions, criticalGroups }: ReportsTabProps) => {
    // Calculate metrics
    const metrics = useMemo(() => {
        const totalStock = Object.values(inventory).reduce((sum, bg) => sum + bg.total, 0);
        const availableStock = Object.values(inventory).reduce((sum, bg) => sum + bg.available, 0);

        // Monthly data (last 6 months)
        const now = new Date();
        const monthlyData = Array.from({ length: 6 }, (_, i) => {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

            const monthDonations = donations.filter(d => {
                const donDate = new Date(d.date);
                return donDate.getMonth() === monthDate.getMonth() &&
                    donDate.getFullYear() === monthDate.getFullYear();
            }).length;

            const monthRedemptions = redemptions.filter(r => {
                const redDate = new Date(r.date);
                return redDate.getMonth() === monthDate.getMonth() &&
                    redDate.getFullYear() === monthDate.getFullYear();
            }).length;

            return { month: monthName, in: monthDonations, out: monthRedemptions };
        });

        // This month stats
        const thisMonthDonations = donations.filter(d => {
            const donDate = new Date(d.date);
            return donDate.getMonth() === now.getMonth() &&
                donDate.getFullYear() === now.getFullYear();
        }).length;

        const lastMonthDonations = donations.filter(d => {
            const donDate = new Date(d.date);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return donDate.getMonth() === lastMonth.getMonth() &&
                donDate.getFullYear() === lastMonth.getFullYear();
        }).length;

        const growthRate = lastMonthDonations > 0
            ? ((thisMonthDonations - lastMonthDonations) / lastMonthDonations * 100).toFixed(1)
            : '0';

        // Wastage calculation (simplified - available vs total)
        const wastageRate = totalStock > 0
            ? ((totalStock - availableStock) / totalStock * 100).toFixed(1)
            : '0';

        return {
            totalStock,
            availableStock,
            monthlyData,
            thisMonthDonations,
            growthRate,
            wastageRate,
            totalDonations: donations.length,
            totalRedemptions: redemptions.length
        };
    }, [inventory, donations, redemptions]);

    const getPercentage = (units: number) => {
        const total = metrics.totalStock || 1;
        return (units / total) * 100;
    };

    const handleExportCSV = () => {
        // Generate CSV content
        const csvContent = [
            ['Blood Group', 'Total Units', 'Available Units'],
            ...Object.entries(inventory).map(([bg, data]) => [bg, data.total, data.available]),
            [],
            ['Month', 'Donations', 'Redemptions'],
            ...metrics.monthlyData.map(m => [m.month, m.in, m.out])
        ].map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blood-bank-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
                    <p className="text-muted-foreground">Production metrics and audit logs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                        <FileBarChart className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button className="bg-primary gap-2" onClick={handleExportPDF}>
                        <Download className="h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Collection</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalDonations} Units</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.thisMonthDonations} Units</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Collected in {new Date().toLocaleDateString('en-US', { month: 'long' })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Critical Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{criticalGroups.length} Groups</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {criticalGroups.length > 0 ? criticalGroups.join(', ') : 'All stock levels healthy'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.totalStock > 0 ? ((metrics.totalRedemptions / metrics.totalStock) * 100).toFixed(1) : '0'}%
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            Efficient distribution
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Blood Inventory Distribution</CardTitle>
                        <CardDescription>Current stock levels by blood group</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end pt-4 pb-2 px-2">
                            <Bar
                                label="A+"
                                height={getPercentage(inventory['A+']?.total || 0) * 3}
                                value={inventory['A+']?.total || 0}
                                color="bg-red-500"
                            />
                            <Bar
                                label="A-"
                                height={getPercentage(inventory['A-']?.total || 0) * 3}
                                value={inventory['A-']?.total || 0}
                                color="bg-orange-400"
                            />
                            <Bar
                                label="B+"
                                height={getPercentage(inventory['B+']?.total || 0) * 3}
                                value={inventory['B+']?.total || 0}
                                color="bg-red-500"
                            />
                            <Bar
                                label="B-"
                                height={getPercentage(inventory['B-']?.total || 0) * 3}
                                value={inventory['B-']?.total || 0}
                                color="bg-orange-400"
                            />
                            <Bar
                                label="AB+"
                                height={getPercentage(inventory['AB+']?.total || 0) * 3}
                                value={inventory['AB+']?.total || 0}
                                color="bg-red-500"
                            />
                            <Bar
                                label="AB-"
                                height={getPercentage(inventory['AB-']?.total || 0) * 3}
                                value={inventory['AB-']?.total || 0}
                                color="bg-orange-400"
                            />
                            <Bar
                                label="O+"
                                height={getPercentage(inventory['O+']?.total || 0) * 3}
                                value={inventory['O+']?.total || 0}
                                color="bg-red-500"
                            />
                            <Bar
                                label="O-"
                                height={getPercentage(inventory['O-']?.total || 0) * 3}
                                value={inventory['O-']?.total || 0}
                                color="bg-orange-400"
                            />
                        </div>
                        <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Positive Groups</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                <span>Negative Groups</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Production Report</CardTitle>
                        <CardDescription>Donations vs Redemptions (Last 6 Months)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.monthlyData.map((item, idx) => {
                                const maxVal = Math.max(item.in, item.out, 1);
                                return (
                                    <div key={idx} className="flex items-center text-sm">
                                        <span className="w-12 font-medium text-muted-foreground">{item.month}</span>
                                        <div className="flex-1 h-8 bg-muted/30 rounded-full overflow-hidden flex items-center px-1">
                                            <div
                                                style={{ width: `${(item.in / maxVal) * 100}%` }}
                                                className="h-6 bg-blue-500 rounded-l-full flex items-center justify-end pr-2"
                                            >
                                                <span className="text-xs text-white font-bold">{item.in}</span>
                                            </div>
                                            <div
                                                style={{ width: `${(item.out / maxVal) * 100}%` }}
                                                className="h-6 bg-red-500 rounded-r-full flex items-center justify-end pr-2"
                                            >
                                                <span className="text-xs text-white font-bold">{item.out}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div> Collected
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 bg-red-500 rounded"></div> Issued
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};