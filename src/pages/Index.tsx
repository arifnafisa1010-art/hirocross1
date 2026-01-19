import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useTrainingStore } from '@/stores/trainingStore';
import { Header } from '@/components/Header';
import { FloatingDock } from '@/components/FloatingDock';
import { SetupSection } from '@/components/SetupSection';
import { AnnualPlanSection } from '@/components/AnnualPlanSection';
import { MonthlySection } from '@/components/MonthlySection';
import { TestsSection } from '@/components/TestsSection';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TabId } from '@/types/training';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab } = useTrainingStore();

  // Handle tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabId | null;
    if (tabParam && ['setup', 'annual', 'monthly', 'tests'].includes(tabParam)) {
      setActiveTab(tabParam);
      // Clear the URL parameter after setting
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setActiveTab, setSearchParams]);
  return (
    <>
      <Helmet>
        <title>HiroCross Plan - Sports Training Periodization</title>
        <meta 
          name="description" 
          content="Professional annual training program management with mesocycle planning, workout tracking, and performance monitoring for athletes and coaches."
        />
      </Helmet>

      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <Header />
            
            <main className="flex-1 p-6 overflow-auto">
              {activeTab === 'setup' && <SetupSection />}
              {activeTab === 'annual' && <AnnualPlanSection />}
              {activeTab === 'monthly' && <MonthlySection />}
              {activeTab === 'tests' && <TestsSection />}
            </main>

            <FloatingDock />
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
