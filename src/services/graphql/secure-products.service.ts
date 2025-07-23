import { SecureGraphQLService } from "../SecureGraphQLService"
import { CREATE_PRODUCT } from "../../graphql/mutations/products"
import { GET_PRODUCTS, } from "../../graphql/queries/products"

export class SecureProductsService extends SecureGraphQLService {
    async getProducts(filters?: any) {
        return this.executeQuery(GET_PRODUCTS, filters)
    }

    async createProduct(productData: any) {
        return this.executeMutation(CREATE_PRODUCT, { input: productData })
    }

    async updateProduct(id: string, productData: any) {
        return this.executeMutation(CREATE_PRODUCT, {
            id,
            input: productData,
        })
    }

    async deleteProduct(id: string) {
        return this.executeMutation(CREATE_PRODUCT, { id })
    }
}
