describe('Homepage', () => {
    it('should open the homepage successfully', () => {
        cy.visit('http://localhost:3000/');
    });
});

describe('Student', () => {
    it('should be able to select one material and see the videos in itn', () => {
        cy.get('[type="email"]').type('std@gmail.com');
        cy.get('[type="password"]').type('12345');
        cy.get('.sign-button').click();
        cy.get(':nth-child(1) > a').should('be.visible');
        cy.get(':nth-child(2) > .M-img').click();
        cy.get('.courses-container .material-design:nth-child(1)').click();
    });
});

describe('Teacher', () => {
    it('should add video correctly',() => {
        cy.visit('http://localhost:3000/');
        cy.get('[type="email"]').type('test@gmail.com');
        cy.get('[type="password"]').type('12345');
        cy.get('.sign-button').click();
        cy.visit('http://localhost:3000/add-video')
        cy.get('.name-container input').type('video 1');
        cy.get('[placeholder="video url"]').type('https://www.youtube.com');
        cy.get('[placeholder="img url"]').type('https://www.image.com');
        cy.get('type="submit"').click();
    });
});

describe('Admin', () => {
    it('should have access to enter manage class and manage user',() => {
        cy.visit('http://localhost:3000/');
        cy.get('[type="email"]').type('admin@gmail.com');
        cy.get('[type="password"]').type('12345');
        cy.get('.sign-button').click();
        cy.visit('http://localhost:3000/manage-class')
        cy.visit('http://localhost:3000/manage-user')
    });
});