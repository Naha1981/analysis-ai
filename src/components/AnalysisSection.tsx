
import React from 'react';
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DimensionScore {
  name: string;
  score: number;
  reliability: number;
}

interface DepartmentScore {
  department: string;
  [key: string]: string | number;
}

interface AnalysisSectionProps {
  dimensionScores: DimensionScore[];
  departmentScores: DepartmentScore[];
  analysisResult?: any;
  isLoading: boolean;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ dimensionScores, departmentScores, analysisResult, isLoading }) => {
  // Format data for the radar chart
  const radarData = dimensionScores.map(dim => ({
    dimension: dim.name,
    score: dim.score,
    fullMark: 5
  }));

  return (
    <div className="space-y-6 animate-enter">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Analysis Results</h2>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="reliability">Reliability</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dimension Scores</CardTitle>
              <CardDescription>Average scores across all respondents</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dimensionScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderColor: '#e2e8f0',
                        borderRadius: '0.375rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="score" 
                      name="Average Score" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
              <CardDescription>Comparison of scores across departments</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : departmentScores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        {dimensionScores.map((dim) => (
                          <th key={dim.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {dim.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departmentScores.map((dept, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                          {dimensionScores.map((dim) => (
                            <td key={`${dept.department}-${dim.name}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept[dim.name]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No department data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reliability Analysis</CardTitle>
              <CardDescription>Cronbach's Alpha for each dimension</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dimensionScores.map((item) => (
                      <Card key={item.name} className="overflow-hidden">
                        <div className={`h-2 ${item.reliability >= 0.7 ? 'bg-green-500' : item.reliability >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-sm">{item.name}</h3>
                              <p className="text-2xl font-bold mt-1">{item.reliability.toFixed(3)}</p>
                            </div>
                            <Badge variant={item.reliability >= 0.7 ? 'default' : item.reliability >= 0.6 ? 'outline' : 'destructive'}>
                              {item.reliability >= 0.7 ? 'Good' : item.reliability >= 0.6 ? 'Acceptable' : 'Poor'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h4 className="font-medium text-sm mb-2">Interpretation Guide</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• α ≥ 0.7: Good internal consistency</li>
                      <li>• 0.6 ≤ α &lt; 0.7: Acceptable consistency</li>
                      <li>• α &lt; 0.6: Poor consistency; consider revising questions</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="radar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dimension Profile</CardTitle>
              <CardDescription>Radar chart showing dimension scores</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart outerRadius={90} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-6">
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Descriptive Statistics</CardTitle>
                <CardDescription>Statistical summary of the data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm mb-2">Mean Values</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(analysisResult.statistics.means).map(([dim, value]: [string, any]) => (
                        <div key={dim} className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-500">{dim}</p>
                          <p className="text-lg font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm mb-2">Median Values</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(analysisResult.statistics.medians).map(([dim, value]: [string, any]) => (
                        <div key={dim} className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-500">{dim}</p>
                          <p className="text-lg font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm mb-2">Standard Deviations</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(analysisResult.statistics.stdDevs).map(([dim, value]: [string, any]) => (
                        <div key={dim} className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-500">{dim}</p>
                          <p className="text-lg font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-sm mb-2 text-yellow-700">Weak Dimensions (Score &lt; 2.5)</h3>
                      {analysisResult.statistics.weakDimensions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {analysisResult.statistics.weakDimensions.map((dim: string) => (
                            <li key={dim} className="text-sm">{dim}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No weak dimensions identified</p>
                      )}
                    </div>
                    
                    <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-sm mb-2 text-green-700">Strong Dimensions (Score &gt; 4.0)</h3>
                      {analysisResult.statistics.strongDimensions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {analysisResult.statistics.strongDimensions.map((dim: string) => (
                            <li key={dim} className="text-sm">{dim}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No strong dimensions identified</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisSection;
