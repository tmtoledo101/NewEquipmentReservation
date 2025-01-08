import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'DisplayNewEquipmentRequestWebPartStrings';
import DisplayNewEquipmentRequest from './components/DisplayNewEquipmentRequest';
import { IDisplayNewEquipmentRequestProps } from './components/IDisplayNewEquipmentRequestProps';
import { sp } from "@pnp/sp/presets/all";
import { SPComponentLoader } from '@microsoft/sp-loader';


export interface IDisplayNewEquipmentRequestWebPartProps {
  description: string;
  siteUrl: string;
  siteRelativeUrl: string;
}

export default class DisplayNewEquipmentRequestWebPart extends BaseClientSideWebPart<IDisplayNewEquipmentRequestWebPartProps> {
  protected onInit(): Promise<void> {
    return super.onInit().then(_ => {
      SPComponentLoader.loadCss('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap');
      SPComponentLoader.loadCss('https://fonts.googleapis.com/icon?family=Material+Icons');
      SPComponentLoader.loadCss(`${this.context.pageContext.web.absoluteUrl}/Shared%20Documents/commentHide.css`);

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
    const element: React.ReactElement<IDisplayNewEquipmentRequestProps > = React.createElement(
      DisplayNewEquipmentRequest,
      {
        description: this.properties.description,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        siteRelativeUrl: this.context.pageContext.web.serverRelativeUrl
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
