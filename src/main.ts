import {updateLanguageUI} from "./localization/localization.ts";
import {setupSettingsScreen} from "./screens/settings-screen.ts";
import {TestScreen} from "./screens/test-screen.ts";
import {setupBeginTestScreen} from "./screens/begin-test-screen.ts";
import {setupTestTypeSelectionScreen} from "./screens/test-type-selection-screen.ts";
import {setupResultsScreen} from "./screens/results-screen.ts";
import {UsersScreen} from "./screens/user-profiles-screen.ts";
import Router from "./routing/router.ts";
import {setupProfileScreen} from "./screens/user-profile-screen.ts";

const appContainer = document.getElementById('app')! as HTMLElement;

// Register routes
Router.registerRoute('/settings', () => setupSettingsScreen(appContainer));
Router.registerRoute('/testTypeSelection', () => setupTestTypeSelectionScreen(appContainer));
Router.registerRoute('/beginTest', () => setupBeginTestScreen(appContainer));
Router.registerRoute('/test', () => new TestScreen(appContainer).setupScreen());
Router.registerRoute('/users', async () => {
  appContainer.innerHTML = '<p>Loading...</p>';
  try {
    await new UsersScreen(appContainer).setupScreen();
  } catch (error) {
    console.error('Failed to load User Screen:', error);
    appContainer.innerHTML = '<p>Error loading user screen. Please try again later.</p>';
  }
});
Router.registerRoute('/results', () => {
  const state = history.state;
  const reactionTimes = state?.reactionTimes;
  if (!reactionTimes) {
    console.error('Reaction times missing for results.');
    appContainer.innerHTML = '<p>Error loading results. Please try again.</p>';
    return;
  }
  setupResultsScreen(appContainer, reactionTimes);
});
Router.registerRoute('/profile', () => {
  const state = history.state;
  const user = state?.user;
  const tests = state?.tests;

  if (!user || !tests) {
    console.error('User or tests data missing for profile.');
    appContainer.innerHTML = '<p>Error loading profile. Please try again.</p>';
    return;
  }

  setupProfileScreen(appContainer, user, tests);
});

// Initialize router
Router.initialize();
Router.navigate('/settings'); // Default route

updateLanguageUI();
