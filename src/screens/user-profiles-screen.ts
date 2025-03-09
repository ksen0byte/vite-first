import {setupHeader} from '../components/header';
import {setupFooter} from '../components/footer';
import {localize, updateLanguageUI} from '../localization/localization';
import {db, User} from "../db/db";
import {setupProfileScreen} from "./user-profile-screen";
import {setupSettingsScreen} from "./settings-screen";
import {getAllUsers, getTestsForUser} from "../db/operations";

export class UsersScreen {
  private readonly appContainer: HTMLElement;
  private users: User[] = []; // Cached state for users

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;

    // Bind methods to ensure `this` context is preserved
    this.setupScreen = this.setupScreen.bind(this);
    this.viewUserProfile = this.viewUserProfile.bind(this);
    this.addUser = this.addUser.bind(this);
  }

  /**
   * Renders the Users Screen.
   */
  public async setupScreen() {
    this.appContainer.innerHTML = '<p>Loading...</p>'; // Loading indicator

    try {
      this.users = await getAllUsers(); // Fetch users and cache the result
      this.renderUsers(); // Render users

      // Set up the header
      setupHeader(this.appContainer);

      // Setup the footer with `main-page-btn`
      setupFooter(
        this.appContainer,
        this.usersScreenFooterHTML(),
        [
          {
            buttonFn: () => document.getElementById("main-page-btn")! as HTMLButtonElement,
            callback: () => this.navigateToMainPage()
          }
        ]
      );

      this.attachEventListeners();
      updateLanguageUI();
    } catch (error) {
      console.error("Error rendering the Users screen:", error);
      this.appContainer.innerHTML = '<p>Error loading users screen. Please try again.</p>';
    }
  }

  /**
   * Renders all user cards within the screen.
   */
  private renderUsers() {
    // Check if the user list container already exists
    const usersContainer = this.appContainer.querySelector('.users-list');

    if (usersContainer) {
      // Update only the user list container
      usersContainer.innerHTML = this.users.map(this.userCardHTML).join('');
    } else {
      // Initial render (header, footer, and user list all together)
      this.appContainer.innerHTML = `
      <div id="users-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
        <div class="users-list flex-1 space-y-4">
          ${this.users.map(this.userCardHTML).join('')}
        </div>
      </div>
    `;
    }
  }  /**
   * Generates the HTML for a user card.
   */
  private userCardHTML(user: User): string {
    const {firstName, lastName, gender, age} = user;

    return `
      <div class="card shadow-md bg-base-100">
        <div class="card-body">
          <div class="flex justify-between">
            <h2 class="card-title">${firstName} ${lastName}</h2>
            <div class="flex justify-between gap-x-2">
                <button class="btn btn-sm btn-outline btn-info view-profile-btn" data-first-name="${firstName}" data-last-name="${lastName}">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /> </svg>
                  <span data-localize="viewProfileButton"></span>
                </button>
                <button class="btn btn-sm btn-outline btn-error delete-user-btn" data-first-name="${firstName}" data-last-name="${lastName}">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"> <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg>
                  <span data-localize="deleteButton"></span>
                </button>
            </div>
          </div>
          <div class="space-y-2">
            <p><strong data-localize="ageLabel"></strong>: ${age ?? '-'}</p>
            <p class="${gender === "male" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="male"></span></p>
            <p class="${gender === "female" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="female"></span></p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attaches event listeners to dynamically generated buttons.
   */
  private attachEventListeners() {
    this.appContainer.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;

      // Delegate the event strictly to the delete-user-btn
      const deleteButton = target.closest<HTMLButtonElement>('.delete-user-btn');
      if (deleteButton) {
        event.stopImmediatePropagation(); // Ensure the event is not processed multiple times

        const firstName = deleteButton.getAttribute('data-first-name')!;
        const lastName = deleteButton.getAttribute('data-last-name')!;
        await this.deleteUser(firstName, lastName);
        return;
      }

      // Delegate the event to the view-profile-btn
      const viewButton = target.closest<HTMLButtonElement>('.view-profile-btn');
      if (viewButton) {
        event.stopImmediatePropagation(); // Prevent duplicate or unintended event handlers

        const firstName = viewButton.getAttribute('data-first-name')!;
        const lastName = viewButton.getAttribute('data-last-name')!;
        await this.viewUserProfile(firstName, lastName);
        return;
      }
    });
  }
  /**
   * Adds a user dynamically to the view without re-rendering all users.
   */
  public addUser(user: User) {
    this.users.push(user); // Update the state
    const userHtml = this.userCardHTML(user);
    const usersContainer = this.appContainer.querySelector('.flex-1');
    if (usersContainer) {
      usersContainer.insertAdjacentHTML('beforeend', userHtml);
    }
  }

  /**
   * Deletes a user and their associated tests after confirmation.
   */
  private async deleteUser(firstName: string, lastName: string) {
    const userKey = `${firstName}|${lastName}`;

    // Ask for confirmation before proceeding
    const confirmation = confirm(localize('deleteConfirmation').replace('%s', `${firstName} ${lastName}`));
    if (!confirmation) {
      return; // Exit if the user cancels
    }

    try {
      // Delete user and associated tests
      await db.transaction('rw', db.users, db.tests, async () => {
        // Delete the user
        await db.users.where('[firstName+lastName]').equals([firstName, lastName]).delete();

        // Delete associated test records
        await db.tests.where('userKey').equals(userKey).delete();
      });

      // Remove the user visually from the list
      this.users = this.users.filter(u => !(u.firstName === firstName && u.lastName === lastName));
      this.renderUsers(); // Re-render the user list
      updateLanguageUI();
    } catch (error) {
      console.error('Error deleting user or associated tests:', error);
      alert(localize('deleteError'));
    }
  }

  /**
   * Generates the footer HTML for the screen.
   */
  private usersScreenFooterHTML(): string {
    return `
      <footer id="user-profile-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
        <div class="flex-1"></div>
        <button id="main-page-btn" class="btn btn-outline btn-success" data-localize="backToMainPage"></button>
      </footer>
    `;
  }

  /**
   * Handles navigation to the user's profile.
   */
  public async viewUserProfile(firstName: string, lastName: string): Promise<void> {
    const user = (await getAllUsers()).find(u => u.firstName === firstName && u.lastName === lastName);

    if (!user) {
      console.error("User not found!");
      return;
    }

    const tests = await getTestsForUser(firstName, lastName);

    setupProfileScreen(this.appContainer, user, tests);
  }

  /**
   * Navigates back to the main page (e.g. settings screen).
   */
  private navigateToMainPage() {
    setupSettingsScreen(this.appContainer);
  }
}
