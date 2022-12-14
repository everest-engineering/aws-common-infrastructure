# Everest AWS common infrastructure

This is a base project to create the infrastructure needed to develop applications in AWS. As part of this project we are using the CDKTF tool [https://developer.hashicorp.com/terraform/cdktf] to create a VPC with the below architecture. 

![Alt text](docs/Vpc.png?raw=true "Everest VPC")

An ECS cluster too will be provisioned as part of this stack.

Basic commands to get started: 

        cdktf get : Fetches the required providers and modules
        cdktf synth : Generates Terraform configuration 
        cdktf deploy: Deploys the stack to a given region
        cdktf destroy: Destroys the stack

A few CDKTF commands have been outlined in [here](docs/help)