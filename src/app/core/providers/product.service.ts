import { Injectable } from '@angular/core';
import { RequestorService } from './requestor.service';
import { gql } from 'apollo-angular';
import {
  ASSET_FRAGMENT,
  FACET_VALUE_FRAGMENT,
  PRODUCT_VARIANT_FRAGMENT,
  TAX_RATE_FRAGMENT,
} from '../../common/framents.graph';
import { Query } from '../../common/vendure-types';
import { filter, map } from 'rxjs/operators';
import { notNullOrNotUndefined } from '../../common/utils/not-null-or-not-undefined';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  GET_PRODUCT_DETAILS = gql`
    query product($productSlug: String!) {
      product(slug: $productSlug) {
        id
        name
        description
        variants {
          ...ProductVariant
        }
        facetValues {
          ...FacetValue
        }
        featuredAsset {
          id
          preview
        }
        assets {
          ...Asset
        }
        customFields {
          specifications
        }
      }
    }
    ${TAX_RATE_FRAGMENT}
    ${ASSET_FRAGMENT}
    ${FACET_VALUE_FRAGMENT}
    ${PRODUCT_VARIANT_FRAGMENT}
  `;

  GET_PRODUCTS_LIST = gql`
    query products($productListOptions: ProductListOptions!){
      products(options: $productListOptions) {
        totalItems
        items{
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
          variants {
            id
            name
            priceWithTax
            stockLevel
            sku
            customFields {
              strikethrough_price
            }
          }
          collections {
            id
          }
        }
      }
    }
  `

  GET_POPULAR_PRODUCTS = gql `
    query getPopularProducts {
      products {
        items {
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
          variants {
            priceWithTax
            customFields{
              strikethrough_price
              is_featured
            }
          }
        }
      }
    }
  `
  constructor(private requestor: RequestorService) {}

  getProductDetails(productSlug: string): Observable<Query["product"]> {
    return this.requestor
      .query(this.GET_PRODUCT_DETAILS, {
        productSlug,
      })
      .pipe(
        map((res) => res.product),
        filter(notNullOrNotUndefined)
      );
  }

  getProductList({ skip, take }: { skip: number, take?: number }) {
    // let productListOptions: any = {
    //   skip: +skip || 0,
    //   take: take ? +take : 6
    // }
    // if (skip === -1) {
    //   productListOptions = {
    //     skip: 0
    //   }
    // }

    const productListOptions = {
      skip: 0
    }
    return this.requestor
      .query(this.GET_PRODUCTS_LIST, {
        productListOptions
      }).pipe(
        map((res) => res.products)
      );
  }

  getPopularProducts() {
    return this.requestor.query(this.GET_POPULAR_PRODUCTS).pipe(
      map((res) => res.products)
    )
  }
}
