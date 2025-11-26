import Router from "../../routing/router.ts";
import { setupHeader } from "../../components/header.ts";
import { updateLanguageUI } from "../../localization/localization.ts";

export function setupDashboardScreen(appContainer: HTMLElement) {
  appContainer.innerHTML = `
    <div class="bg-base-200 flex flex-col">
      <div id="dashboard-content" class="container mx-auto p-4 flex-grow">
        <h1 class="text-3xl font-bold mb-6 text-center" data-localize="dashboardHeaderTitle">Tools and Services</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" id="service-reaction">
            <figure class="px-10 pt-10">
              <span class="text-6xl">⏱️</span>
            </figure>
            <div class="card-body items-center text-center">
              <h2 class="card-title" data-localize="testTypePzmrLong">Reaction Test</h2>
              <p data-localize="dashboardReactionDesc">Classic SVMR test to measure CNS functional state.</p>
              <div class="card-actions">
                <button class="btn btn-primary" data-localize="open">Open</button>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" id="service-bio-age">
            <figure class="px-10 pt-10">
              <span class="text-6xl">🧬</span>
            </figure>
            <div class="card-body items-center text-center">
              <h2 class="card-title" data-localize="screenBiologicalAgeCalculatorTitle">Biological Age Calculator</h2>
              <p data-localize="dashboardBioAgeDesc">Calculate Biological Age based on known reaction time.</p>
              <div class="card-actions">
                <button class="btn btn-secondary" data-localize="open">Open</button>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" id="service-profiles">
            <figure class="px-10 pt-10">
              <span class="text-6xl">📂</span>
            </figure>
            <div class="card-body items-center text-center">
              <h2 class="card-title" data-localize="savedTestsBtnLabel">Database</h2>
              <p data-localize="dashboardProfilesDesc">Manage users and view history.</p>
              <div class="card-actions">
                <button class="btn btn-accent" data-localize="open">Open</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  setupHeader(appContainer);
  
  // Event handlers
  document.getElementById('service-reaction')?.addEventListener('click', () => Router.navigate('/settings'));
  document.getElementById('service-bio-age')?.addEventListener('click', () => Router.navigate('/bio-age-calculator'));
  document.getElementById('service-profiles')?.addEventListener('click', () => Router.navigate('/users'));

  updateLanguageUI();
}
