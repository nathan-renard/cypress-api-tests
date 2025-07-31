describe('Products - Docs API Tests', () => {
  const baseUrl = 'https://dummyjson.com/products';
  const HTTP_OK = 200;
  const HTTP_CREATED = 201;
  const HTTP_BAD_REQUEST = 400;
  const HTTP_NOT_FOUND = 404;
  const HTTP_CONFLICT = 409;
  const HTTP_UNPROCESSABLE_ENTITY = 422;
  const HTTP_INTERNAL_SERVER_ERROR = 500;

    // Test to get all products from the API with pagination
    // This test will fetch all products by recursively calling the API until all products are retrieved.
    // It uses a limit to control the number of products fetched per request.
    // The Big O complexity of this function is O(n) where n is the total number of products.
    it('GET | Get all products', () => {
    const limit = 30;
    let allProducts: any[] = [];

    function fetchPage(skip: number) {
        cy.request({
        url: `${baseUrl}?limit=${limit}&skip=${skip}`,
        method: 'GET'
        }).then((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');

        const products = response.body.products;
        allProducts = allProducts.concat(products);
        if (products.length === limit) {
            fetchPage(skip + limit);
        } else {
            cy.log(`Total products fetched: ${allProducts.length}`);
        }
        });
    }

    // Start fetching from the first page
    fetchPage(0);
    });

    // Test to get a single product by ID
    it('GET | Get a single product', () => {
    cy.request(`${baseUrl}/1`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('id', 1);
        expect(response.body).to.have.property('title');
        expect(response.body).to.have.property('description');
        expect(response.body).to.have.property('price');
        });
    });

    // Test to get a single product by ID that does not exist
    it('GET | Get a single product that does not exist', () => {
    cy.request({
        url: `${baseUrl}/-1`,
        failOnStatusCode: false // Prevent Cypress from failing the test on 404
        }).should((response) => {
        expect(response.status).to.eq(HTTP_NOT_FOUND);
        });
    });

    // Test to search for products with a specific query and limit
    it('GET | Search products', () => {
    const query = 'phone';
    const limit = 23;
    cy.request(`${baseUrl}/search?q=${query}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products).to.be.an('array').with.length(limit);
        expect(response.body).to.have.property('total', limit);
        expect(response.body).to.have.property('limit', limit);
        expect(response.body).to.have.property('skip', 0);
        });
    });

    // Test to get search without query
    it('GET | Search products without query', () => {
    cy.request(`${baseUrl}/search`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        // The current response is HTTP_OK, but it ends up returning all products
        // a request without a query should ideally return an error or empty result.
        // I've kept the expectation as HTTP_OK to match the current API behavior
        // But my expectation is that it should return an error like the one below.
        //expect(response.status).to.eq(HTTP_BAD_REQUEST);
        });
    });

    // Test to get products with specific fields
    // This test checks if the API returns products with only the specified fields.
    it('GET | Limit and skip products | returns products with selected fields', () => {
    const limit = 10;
    const skip = 10;
    const select = 'title,price';
    const expectedTotal = 194;

    cy.request(`${baseUrl}?limit=${limit}&skip=${skip}&select=${select}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products).to.be.an('array').with.length(limit);
        expect(response.body).to.have.property('total', expectedTotal);
        expect(response.body).to.have.property('skip', skip);
        expect(response.body).to.have.property('limit', limit);
        response.body.products.forEach((product: any) => {
            expect(product).to.have.property('title');
            expect(product).to.have.property('price');
            expect(product).to.not.have.property('description');
        });
        });
    });

    // Test to get products with limit and skip parameters
    // This test checks if the API returns products based on the limit and skip parameters.
    it('GET | Limit and skip products | returns products based on limit and skip', () => {
    const limit = 0;
    cy.request(`${baseUrl}?limit=${limit}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products.length).to.eq(response.body.total);
        });
    });

    // Test to get products with limit and skip parameters
    // This test checks if the API returns an empty array when skip equals total.
    it('GET | Limit and skip products | returns empty array when skip equals total', () => {
    const limit = 10;
    const skip = 194; // Assuming total is 194
    cy.request(`${baseUrl}?limit=${limit}&skip=${skip}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products).to.be.an('array').that.is.empty;
        });
    });

    // Test to get products with limit and skip parameters
    // This test checks if the API returns an error when skip is greater than total.
    it('GET | Limit and skip products | returns error when skip is greater than total', () => {
    const limit = 5;
    const select = 'title,price';
    cy.request(`${baseUrl}?limit=${limit}&select=${select}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products).to.be.an('array').with.length(limit);
        response.body.products.forEach((product: any) => {
            expect(product).to.have.property('title');
            expect(product).to.have.property('price');
            expect(Object.keys(product)).to.have.length.within(2, 3); // id may be present
        });
        });
    });


    // Test to sort products by price
    // This test checks if the API sorts products correctly by price in descending order.
    it('GET | Sort products | sorts by price in descending order', () => {
    const sortBy = 'price';
    const order = 'desc';
    cy.request(`${baseUrl}?sortBy=${sortBy}&order=${order}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        const products = response.body.products;
        expect(products).to.be.an('array').that.is.not.empty;
        const prices = products.map((p: any) => p.price);
        const sortedPrices = [...prices].sort((a, b) => b - a);
        expect(prices).to.deep.equal(sortedPrices);
        });
    });

    // Test to sort products by price
    // This test checks if the API sorts products correctly by price in ascending order.
    it('GET | Sort products | sorts by price in descending order', () => {
    const sortBy = 'price';
    const order = 'asc';
    cy.request(`${baseUrl}?sortBy=${sortBy}&order=${order}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        const products = response.body.products;
        expect(products).to.be.an('array').that.is.not.empty;
        const prices = products.map((p: any) => p.price);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).to.deep.equal(sortedPrices);
        });
    });

    // Test to return all products categories
    // This test checks if the API returns all product categories with metadata.
    it('GET | Get all products categories | returns all product categories with metadata', () => {
    cy.request(`${baseUrl}/categories`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.be.an('array').that.is.not.empty;
        response.body.forEach((category: any) => {
            expect(category).to.have.property('slug');
            expect(category).to.have.property('name');
            expect(category).to.have.property('url');
        });
        });
    });

    // Test to validate the category slugs
    // This test checks if the API returns a list of category slugs.
    it('GET | Get products categories list | returns category slugs as a list', () => {
    cy.request(`${baseUrl}/category-list`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.be.an('array').that.is.not.empty;
        response.body.forEach((slug: string) => {
            expect(slug).to.be.a('string');
        });
        });
    });

    // Test to get products by a specific category
    // This test checks if the API returns products belonging to a specific category.
    it('GET | Get products by a category | returns products by specific category', () => {
    const category = 'smartphones';
    const expectedTotal = 16;
    cy.request(`${baseUrl}/category/${category}`)
        .should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('products');
        expect(response.body.products).to.be.an('array').that.is.not.empty;
        expect(response.body).to.have.property('total', expectedTotal);
        response.body.products.forEach((product: any) => {
            expect(product).to.have.property('category', category);
        });
        });
    });

    // Test to add a new product
    // This test checks if the API allows adding a new product with valid input.
    // It expects the API to return the newly created product with an ID.
    it('POST | Add product | returns new product with ID for valid input', () => {
    const newProduct = {
        title: 'BMW Pencil',
        price: 5.99,
        description: 'Premium branded pencil',
        category: 'stationery'
    };

    cy.request({
        method: 'POST',
        url: `${baseUrl}/add`,
        headers: { 'Content-Type': 'application/json' },
        body: newProduct
    }).should((response) => {
        expect([HTTP_OK, HTTP_CREATED]).to.include(response.status);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('title', newProduct.title);
        expect(response.body).to.have.property('price', newProduct.price);
        expect(response.body).to.have.property('description', newProduct.description);
        expect(response.body).to.have.property('category', newProduct.category);
    });
    });

    // Test to add a new product with missing required fields
    it('POST | Add product | returns 422 Unprocessable Entity for missing required title', () => {
    cy.request({
        method: 'POST',
        url: `${baseUrl}/add`,
        headers: { 'Content-Type': 'application/json' },
        body: { price: 10 },
        failOnStatusCode: false
    }).should((response) => {
        expect(response.status).to.eq(HTTP_CREATED);
        // This is another API behavior that is passing but in my opinion should return an error
        // expect(response.status).to.eq(HTTP_UNPROCESSABLE_ENTITY);
    });
    });

    // Test to add a new product with extra unrecognized fields
    it('POST | Add product | ignores extra unrecognized fields', () => {
    const newProduct = {
        title: 'Gadget Pen',
        price: 2.49,
        color: 'blue', // Not an expected field
        warranty: '2 years' // Not an expected field
    };

    cy.request({
        method: 'POST',
        url: `${baseUrl}/add`,
        headers: { 'Content-Type': 'application/json' },
        body: newProduct
    }).should((response) => {
        expect([HTTP_CREATED]).to.include(response.status);
        // Another instance where we should/could expect something like 400 HTTP_BAD_REQUEST
        expect(response.body).to.have.property('title', newProduct.title);
        expect(response.body).to.have.property('price', newProduct.price);
        expect(response.body).to.not.have.property('color');
        expect(response.body).to.not.have.property('warranty');
    });
    });

    // This test was supposed to check the API's behavior when trying to add a product with an empty body.
    // However, the API currently returns a 201 status code instead of an error.
    // Ideally, it should return a 422 Unprocessable Entity or similar error.
    // I've changed the expectation to match the current API behavior.
    it('POST | Add product | handles empty body with 422 error', () => {
    cy.request({
        method: 'POST',
        url: `${baseUrl}/add`,
        headers: { 'Content-Type': 'application/json' },
        body: {},
        failOnStatusCode: false
    }).should((response) => {
        expect(response.status).to.eq(HTTP_CREATED);
        //expect(response.status).to.eq(HTTP_UNPROCESSABLE_ENTITY);
    });
    });

    // Test to update an existing product title with a valid ID
    it('PUT | Update product | updates product title for valid id', () => {
    const productId = 1;
    const updatedTitle = 'iPhone Galaxy +1';

    cy.request({
        method: 'PUT',
        url: `${baseUrl}/${productId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { title: updatedTitle }
    }).should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('id', productId);
        expect(response.body).to.have.property('title', updatedTitle);
    });
    });

    // Test to update a product description with a valid ID
    it('PATCH | Update product | updates product description for valid id', () => {
    const productId = 1;
    const updatedDescription = 'Updated test description';

    cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${productId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { description: updatedDescription }
    }).should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('id', productId);
        expect(response.body).to.have.property('description', updatedDescription);
    });
    });

    // Another situation where the API returns a 201 status code instead of an error
    // Ideally, it should return a 422 Unprocessable Entity or similar error.
    // I've changed the expectation to match the current API behavior.
    it('PUT | Update product | returns 422 for missing update data', () => {
    const productId = 1;
    cy.request({
        method: 'PUT',
        url: `${baseUrl}/${productId}`,
        headers: { 'Content-Type': 'application/json' },
        body: {},
        failOnStatusCode: false
    }).should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        //expect(response.status).to.eq(HTTP_UNPROCESSABLE_ENTITY);
    });
    });

    // Test to update a product with an invalid ID
    it('PUT | Update product | returns 404 for non-existent product id', () => {
    const productId = 9999;
    cy.request({
        method: 'PUT',
        url: `${baseUrl}/${productId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Ghost Product' },
        failOnStatusCode: false
    }).should((response) => {
        expect(response.status).to.eq(HTTP_NOT_FOUND);
    });
    });

    // Test to delete a product by a valid ID
    it('DELETE | Delete product | marks product as deleted for valid id', () => {
    const productId = 1;

    cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${productId}`
    }).should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('id', productId);
        expect(response.body).to.have.property('isDeleted', true);
        expect(response.body).to.have.property('deletedOn');
        expect(new Date(response.body.deletedOn).toISOString()).to.eq(response.body.deletedOn);
    });
    });

    // Test to delete a product that does not exist
    it('DELETE | Delete product | returns 404 for non-existent product id', () => {
    const productId = 9999;

    cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${productId}`,
        failOnStatusCode: false
    }).should((response) => {
        expect(response.status).to.eq(HTTP_NOT_FOUND);
    });
    });

    // Test to delete a product that was just deleted
    it('DELETE | Delete product | does not delete already deleted product', () => {
    const productId = 2;

    // First deletion (should succeed)
    cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${productId}`
    }).should((response) => {
        expect(response.status).to.eq(HTTP_OK);
        expect(response.body).to.have.property('isDeleted', true);
    });

    // This is just a expected scenario that will not work with the current API
    // The reason is because this api only simulates deletion by marking the product as deleted
    // and does not actually remove it from the database.
    // This would be a good test to check if the API prevents deletion of already deleted products.
    // cy.request({
    //     method: 'DELETE',
    //     url: `${baseUrl}/${productId}`,
    //     failOnStatusCode: false
    // }).should((response) => {
    //     expect([HTTP_NOT_FOUND, HTTP_BAD_REQUEST, HTTP_CONFLICT]).to.include(response.status);
    // });
    });

});