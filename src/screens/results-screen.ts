// results-screen.ts

import {setupHeader} from "../components/header.ts";
import {setupFooter} from "../components/footer.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {ReactionTimeStats} from "../stats/ReactionTimeStats.ts";

export function setupResultsScreen(
  appContainer: HTMLElement,
  reactionTimes: Map<number, number>
) {
  const data = Array.from(reactionTimes.values());

  if (!data.length) {
    appContainer.innerHTML = `
      <div id="results-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
        <h2 class="text-2xl font-bold mb-4" data-localize="noReactionTimes">No Reaction Times</h2>
      </div>
    `;
    setupHeader(appContainer);
    setupFooter(appContainer, footerHtml(), []);
    updateLanguageUI();
    return;
  }

  // Frequency distribution
  const reactionTimeStats = new ReactionTimeStats(data);

  const functionalLevelVal = reactionTimeStats.calculateFunctionalLevel();
  const reactionStability = reactionTimeStats.calculateReactionStability();
  const functionalCapabilities = reactionTimeStats.calculateFunctionalCapabilities();

  // Render
  appContainer.innerHTML = `
    <div id="results-screen" class="flex flex-col flex-grow p-4 space-y-4">
      <!-- Title -->
      <h2 class="text-2xl font-bold mb-4" data-localize="testResultsTitle">Test Results</h2>

      <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">
        <!-- Functional Level -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statFunctionalLevel">Count</div>
          <div class="stat-value text-lg">${functionalLevelVal ? functionalLevelVal.toFixed(2) : "N/A"}</div>
        </div>
        
        <!-- Functional Level -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statReactionStability">Count</div>
          <div class="stat-value text-lg">${reactionStability ? reactionStability.toFixed(2) : "N/A"}</div>
        </div>
        
        <!-- Functional Level -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statFunctionalCapabilities">Count</div>
          <div class="stat-value text-lg">${functionalCapabilities ? functionalCapabilities.toFixed(2) : "N/A"}</div>
        </div>
      </div>
      <!-- First stats block (count, mean, median, variance, std dev, range) -->
      <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">

        <!-- Count -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statCount">Count</div>
          <div class="stat-value text-lg">${reactionTimeStats.count}</div>
        </div>

        <!-- Mean -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statMean">Mean</div>
          <div class="stat-value text-lg">${reactionTimeStats.meanVal !== null ? reactionTimeStats.meanVal.toFixed(2) + localize("ms") : "N/A"}</div>
        </div>

        <!-- Mode -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statMode">Median</div>
          <div class="stat-value text-lg">${reactionTimeStats.modeVal !== null ? reactionTimeStats.modeVal.toFixed(2) + localize("ms") : "N/A"}</div>
        </div>

        <!-- Std Dev -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statStdDev">Std Dev</div>
          <div class="stat-value text-lg">${reactionTimeStats.stdevVal.toFixed(2)}</div>
        </div>

      </div>

      <!-- Second stats block (percentiles) -->
      <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">

        <!-- p3 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP3">p3</div>
          <div class="stat-value text-lg">${reactionTimeStats.p3Val.toFixed(2)}ms</div>
        </div>

        <!-- p10 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP10">p10</div>
          <div class="stat-value text-lg">${reactionTimeStats.p10Val.toFixed(2)}ms</div>
        </div>

        <!-- p25 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP25">p25</div>
          <div class="stat-value text-lg">${reactionTimeStats.p25Val.toFixed(2)}ms</div>
        </div>

        <!-- p50 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP50">p50</div>
          <div class="stat-value text-lg">${reactionTimeStats.p50Val.toFixed(2)}ms</div>
        </div>

        <!-- p75 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP75">p75</div>
          <div class="stat-value text-lg">${reactionTimeStats.p75Val.toFixed(2)}ms</div>
        </div>

        <!-- p90 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP90">p90</div>
          <div class="stat-value text-lg">${reactionTimeStats.p90Val.toFixed(2)}ms</div>
        </div>

        <!-- p97 -->
        <div class="stat place-items-center">
          <div class="stat-title text-base" data-localize="statP97">p97</div>
          <div class="stat-value text-lg">${reactionTimeStats.p97Val.toFixed(2)}ms</div>
        </div>
      </div>

      <!-- Frequency Distribution Table -->
      <div class="flex flex-grow p-8">
        <canvas id="frequencyChart"></canvas>
      </div>
    </div>
  `;

  setupHeader(appContainer);
  setupFooter(appContainer, footerHtml(), []);
  reactionTimeStats.drawHistogram(document.getElementById('frequencyChart')! as HTMLCanvasElement);
  updateLanguageUI();
}

function footerHtml(): string {
  return `
    <footer id="results-screen-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <!-- Additional nav or buttons if desired -->
    </footer>
  `;
}
