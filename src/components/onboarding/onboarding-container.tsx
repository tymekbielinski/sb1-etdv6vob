import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { TeamOnboarding } from './team-onboarding';
import { TemplateSelection } from './template-selection';
import { TeamMembershipConfirmation } from './team-membership-confirmation';
import { LoadingScreen } from '@/components/loading-screen';
import { userHasTeam, checkEmailInTeams } from '@/lib/api/onboarding';

// Define the onboarding steps
enum OnboardingStep {
  NONE,
  TEAM_CREATION,
  TEAM_MEMBERSHIP_CONFIRMATION,
  TEMPLATE_SELECTION
}

interface OnboardingContainerProps {
  children: React.ReactNode;
}

export function OnboardingContainer({ children }: OnboardingContainerProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.NONE);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [hasTeam, setHasTeam] = useState(false);
  const [pendingTeam, setPendingTeam] = useState<{ id: string; name: string } | null>(null);
  const [hasCompletedTemplateSelection, setHasCompletedTemplateSelection] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check localStorage for template selection completion
  useEffect(() => {
    const hasSelectedTemplate = localStorage.getItem('onboarding_template_selected') === 'true';
    setHasCompletedTemplateSelection(hasSelectedTemplate);
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setLoading(false);
        setCurrentStep(OnboardingStep.NONE);
        return;
      }

      try {
        console.log('Checking onboarding status for user:', user.id);
        
        // Fetch user profile to get name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (userData?.name) {
          setUserName(userData.name);
        } else if (user.user_metadata?.name) {
          // If name not in users table, try user metadata
          setUserName(user.user_metadata.name);
        } else if (user.email) {
          // If no name available, use email prefix as fallback
          const emailName = user.email.split('@')[0];
          setUserName(emailName);
        }

        // Check if user has any teams
        const hasUserTeam = await userHasTeam();
        console.log('User has team:', hasUserTeam);
        setHasTeam(hasUserTeam);
        
        // If user doesn't have a team, check if they've been invited to one
        if (!hasUserTeam && user.email) {
          const pendingTeamData = await checkEmailInTeams(user.email);
          if (pendingTeamData) {
            console.log('User has been invited to team:', pendingTeamData.name);
            setPendingTeam({
              id: pendingTeamData.id,
              name: pendingTeamData.name
            });
          }
        }

        // Check if user has any dashboards
        const { data: dashboards, error: dashboardError } = await supabase
          .from('dashboards')
          .select('id')
          .or(`user_id.eq.${user.id},team_id.in.(select id from teams where user_id = ${user.id})`);

        if (dashboardError) {
          console.error('Error checking dashboards:', dashboardError);
        }

        const hasDashboards = dashboards && dashboards.length > 0;
        console.log('User has dashboards:', hasDashboards, dashboards?.length || 0);

        // For testing purposes, force the template selection step
        // Comment this out in production
        // setCurrentStep(OnboardingStep.TEMPLATE_SELECTION);

        // Check if user has completed template selection from localStorage
        const hasSelectedTemplate = localStorage.getItem('onboarding_template_selected') === 'true';
        setHasCompletedTemplateSelection(hasSelectedTemplate);
        
        console.log('Template selection completed:', hasSelectedTemplate);
        console.log('Has dashboards:', hasDashboards);
        
        // Determine which onboarding step to show
        if (!hasUserTeam) {
          if (pendingTeam) {
            console.log('Showing team membership confirmation step');
            setCurrentStep(OnboardingStep.TEAM_MEMBERSHIP_CONFIRMATION);
          } else {
            console.log('Showing team creation step');
            setCurrentStep(OnboardingStep.TEAM_CREATION);
          }
        } else if (!hasDashboards && !hasSelectedTemplate) {
          console.log('Showing template selection step');
          setCurrentStep(OnboardingStep.TEMPLATE_SELECTION);
        } else {
          console.log('No onboarding needed');
          setCurrentStep(OnboardingStep.NONE);
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
        setCurrentStep(OnboardingStep.NONE);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  const handleTeamCreationComplete = () => {
    setHasTeam(true);
    setCurrentStep(OnboardingStep.TEMPLATE_SELECTION);
  };
  
  const handleTeamMembershipConfirm = () => {
    setHasTeam(true);
    setPendingTeam(null);
    setCurrentStep(OnboardingStep.TEMPLATE_SELECTION);
  };
  
  const handleTeamMembershipDecline = () => {
    setPendingTeam(null);
    setCurrentStep(OnboardingStep.TEAM_CREATION);
  };

  const handleTemplateSelectionComplete = () => {
    // Mark template selection as completed
    setHasCompletedTemplateSelection(true);
    localStorage.setItem('onboarding_template_selected', 'true');
    
    // Move to the next step (which is none in this case)
    setCurrentStep(OnboardingStep.NONE);
    
    // Navigate to the main dashboard
    navigate('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentStep === OnboardingStep.TEAM_MEMBERSHIP_CONFIRMATION && pendingTeam) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <TeamMembershipConfirmation
            teamId={pendingTeam.id}
            teamName={pendingTeam.name}
            onConfirm={handleTeamMembershipConfirm}
            onDecline={handleTeamMembershipDecline}
          />
        </div>
      </div>
    );
  }
  
  if (currentStep === OnboardingStep.TEAM_CREATION) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <TeamOnboarding 
            onComplete={handleTeamCreationComplete} 
            suggestedName={userName ? `${userName}'s Team` : ''}
          />
        </div>
      </div>
    );
  }

  if (currentStep === OnboardingStep.TEMPLATE_SELECTION) {
    return (
      <div className="container max-w-screen-xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <TemplateSelection onComplete={handleTemplateSelectionComplete} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
