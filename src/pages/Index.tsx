import { Helmet } from 'react-helmet-async';
import { useTrainingStore } from '@/stores/trainingStore';
import { Header } from '@/components/Header';
import { FloatingDock } from '@/components/FloatingDock';
import { SetupSection } from '@/components/SetupSection';
import { AnnualPlanSection } from '@/components/AnnualPlanSection';
import { MonthlySection } from '@/components/MonthlySection';
import { MonitoringSection } from '@/components/MonitoringSection';
import { TestsSection } from '@/components/TestsSection';

const Index = () => {
  const { activeTab } = useTrainingStore();

  return (
    <>
      <Helmet>
        <title>HiroCross Plan - Sports Training Periodization</title>
        <meta 
          name="description" 
          content="Professional annual training program management with mesocycle planning, workout tracking, and performance monitoring for athletes and coaches."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8">
          {activeTab === 'setup' && <SetupSection />}
          {activeTab === 'annual' && <AnnualPlanSection />}
          {activeTab === 'monthly' && <MonthlySection />}
          {activeTab === 'monitoring' && <MonitoringSection />}
          {activeTab === 'tests' && <TestsSection />}
        </main>

        <FloatingDock />
      </div>
    </>
  );
};

export default Index;
