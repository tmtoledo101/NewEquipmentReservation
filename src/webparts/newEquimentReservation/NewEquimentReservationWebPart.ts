import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'NewEquimentReservationWebPartStrings';
import NewEquimentReservation from './components/NewEquimentReservation';
import { INewEquimentReservationProps } from './components/INewEquimentReservationProps';
import { sp } from "@pnp/sp/presets/all";
import { SPComponentLoader } from '@microsoft/sp-loader';

export interface INewEquimentReservationWebPartProps {
  description: string;
  siteUrl: string;
}

export default class NewEquimentReservationWebPart extends BaseClientSideWebPart<INewEquimentReservationWebPartProps> {

  protected onInit(): Promise<void> {
    
    SPComponentLoader.loadCss(`${this.context.pageContext.web.absoluteUrl}/Shared%20Documents/commentHide.css`);

    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context,
        sp: {

          headers: {
            Accept: "application/json;odata=verbose",
          },
          baseUrl: this.context.pageContext.web.absoluteUrl,
        },
      });
    });
  }

  public render(): void {
    const element: React.ReactElement<INewEquimentReservationProps > = React.createElement(
      NewEquimentReservation,
      {
        description: this.properties.description,
        siteUrl: this.context.pageContext.web.absoluteUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
